import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { MatchService } from '../../core/services/match.service';
import { ConfigService } from '../../core/services/config.service';
import { PredictionService } from '../../core/services/prediction.service';
import { GroupService } from '../../core/services/group.service';
import { KNOCKOUT_STAGE_ORDER, MATCH_STAGE_LABEL } from '../../core/data/match-stage.data';

interface MatchView {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  kickOffTime: string;
  matchStageId: number;
  isLocked: boolean;
}

interface MatchPredictionForm {
  predictionId: number | null;
  scoreTeamA: number | null;
  scoreTeamB: number | null;
  advancingTeamId: number | null;
  hasPenalties: boolean | null;
}

@Component({
  selector: 'app-eliminatorias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './eliminatorias.component.html',
  styleUrl: './eliminatorias.component.scss',
})
export class EliminatoriasComponent implements OnInit {
  private auth        = inject(AuthService);
  private matchService = inject(MatchService);
  private configService = inject(ConfigService);
  private predictionService = inject(PredictionService);
  private groupService = inject(GroupService);

  readonly stages = KNOCKOUT_STAGE_ORDER;
  readonly stageLabel = MATCH_STAGE_LABEL;

  loading = signal(true);
  saving = signal<number | null>(null);
  errorMsg = signal<string | null>(null);

  activeStage = signal<number>(KNOCKOUT_STAGE_ORDER[0]);
  allMatches = signal<MatchView[]>([]);
  forms = signal<Record<number, MatchPredictionForm>>({});

  readonly matchesForActiveStage = computed<MatchView[]>(() =>
    this.allMatches()
      .filter(m => m.matchStageId === this.activeStage())
      .sort((a, b) => new Date(a.kickOffTime).getTime() - new Date(b.kickOffTime).getTime())
  );

  get knockoutPhaseLocked(): boolean {
    return !this.configService.isKnockoutPhaseActive();
  }

  isStageEnabled(stageId: number): boolean {
    return this.configService.isKnockoutStageActive(stageId);
  }

  ngOnInit(): void {
    this.groupService.ensureLoaded().subscribe();
    this._loadMatches();
  }

  setActiveStage(stageId: number): void {
    if (!this.isStageEnabled(stageId)) return;
    this.activeStage.set(stageId);
  }

  isMatchLocked(match: MatchView): boolean {
    if (this.knockoutPhaseLocked) return true;
    if (!this.isStageEnabled(match.matchStageId)) return true;
    if (match.isLocked) return true;

    // Auto-bloqueo: 1 hora antes del kickoff (calculado en cliente,
    // ya que el backend no implementa esta regla automáticamente).
    const kickoff = new Date(match.kickOffTime).getTime();
    const oneHourBefore = kickoff - 60 * 60 * 1000;
    return Date.now() >= oneHourBefore;
  }

  updateForm(matchId: number, partial: Partial<MatchPredictionForm>): void {
    this.forms.update(f => ({
      ...f,
      [matchId]: { ...this._emptyForm(), ...f[matchId], ...partial },
    }));
  }

  savePrediction(match: MatchView): void {
    if (this.isMatchLocked(match) || this.saving() === match.matchId) return;
    const userId = this.auth.session()?.userId;
    if (!userId) return;

    const form = this.forms()[match.matchId];
    if (form?.scoreTeamA == null || form?.scoreTeamB == null || form?.advancingTeamId == null || form?.hasPenalties == null) {
      this.errorMsg.set('Completa marcador, clasificado y penales antes de guardar.');
      return;
    }

    this.errorMsg.set(null);
    this.saving.set(match.matchId);

    const request$ = form.predictionId
      ? this.predictionService.updateUserKnockoutPrediction(form.predictionId, form.scoreTeamA, form.scoreTeamB, form.advancingTeamId, form.hasPenalties)
      : this.predictionService.createUserKnockoutPrediction(match.matchId, userId, form.scoreTeamA, form.scoreTeamB, form.advancingTeamId, form.hasPenalties);

    request$.subscribe({
      next: (res) => {
        const predictionId = Number(res['predictionId'] ?? res['prediction_id']) || form.predictionId;
        this.updateForm(match.matchId, { predictionId: predictionId ?? null });
        this.saving.set(null);
      },
      error: () => {
        this.errorMsg.set('No se pudo guardar la predicción.');
        this.saving.set(null);
      },
    });
  }

  isSaved(matchId: number): boolean {
    return !!this.forms()[matchId]?.predictionId;
  }

  isSaving(matchId: number): boolean {
    return this.saving() === matchId;
  }

  teamName(countryId: number, fallback?: string): string {
    return this.groupService.countryName(countryId, fallback);
  }

  private _emptyForm(): MatchPredictionForm {
    return { predictionId: null, scoreTeamA: null, scoreTeamB: null, advancingTeamId: null, hasPenalties: null };
  }

  private _loadMatches(): void {
    const userId = this.auth.session()?.userId;
    this.loading.set(true);

    forkJoin({
      matches: this.matchService.getMatches(),
      predictions: userId ? this.predictionService.getUserKnockoutPrediction(userId) : of([]),
    }).subscribe({
      next: ({ matches, predictions }) => {
        const mapped: MatchView[] = (matches ?? []).map(r => ({
          matchId:      Number(r['matchId'] ?? r['match_id']),
          homeTeamId:   Number(r['homeTeamId'] ?? r['home_team_id']),
          awayTeamId:   Number(r['awayTeamId'] ?? r['away_team_id']),
          homeTeamName: String(r['homeTeamName'] ?? r['home_team_name'] ?? ''),
          awayTeamName: String(r['awayTeamName'] ?? r['away_team_name'] ?? ''),
          kickOffTime:  String(r['kickOffTime'] ?? r['kick_off_time'] ?? r['kickoffTime'] ?? ''),
          matchStageId: Number(r['matchStageId'] ?? r['match_stage_id']),
          isLocked:     Number(r['isLocked'] ?? r['is_locked']) === 1,
        })).filter(m => !!m.matchId);

        this.allMatches.set(mapped);

        if (!this.matchesForActiveStage().length) {
          const firstWithMatches = this.stages.find(s => mapped.some(m => m.matchStageId === s));
          if (firstWithMatches) this.activeStage.set(firstWithMatches);
        }

        const forms: Record<number, MatchPredictionForm> = {};
        (predictions ?? []).forEach((p: Record<string, unknown>) => {
          const matchId = Number(p['matchId'] ?? p['match_id']);
          if (!matchId) return;
          forms[matchId] = {
            predictionId: Number(p['predictionId'] ?? p['prediction_id']) || null,
            scoreTeamA: Number(p['scoreTeamA'] ?? p['score_team_a']),
            scoreTeamB: Number(p['scoreTeamB'] ?? p['score_team_b']),
            advancingTeamId: Number(p['advancingTeamId'] ?? p['advancing_team_id']),
            hasPenalties: Boolean(p['hasPenalties'] ?? p['has_penalties']),
          };
        });
        this.forms.set(forms);

        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudieron cargar los partidos.');
        this.loading.set(false);
      },
    });
  }
}
