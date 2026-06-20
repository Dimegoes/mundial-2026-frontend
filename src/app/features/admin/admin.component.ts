import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfigService } from '../../core/services/config.service';
import { MatchService } from '../../core/services/match.service';
import { CsvMatchImportService, CsvImportResult } from '../../core/services/csv-match-import.service';
import { GroupService } from '../../core/services/group.service';
import { KNOCKOUT_STAGE_ORDER, MATCH_STAGE_LABEL } from '../../core/data/match-stage.data';

interface MatchRow {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  kickOffTime: string;
  isLocked: boolean;
}

interface ResultForm {
  homeScore: number | null;
  awayScore: number | null;
  penalties: boolean | null;
  winnerTeamId: number | null;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private configService = inject(ConfigService);
  private matchService = inject(MatchService);
  private csvImportService = inject(CsvMatchImportService);
  private groupService = inject(GroupService);

  readonly stages = KNOCKOUT_STAGE_ORDER;
  readonly stageLabel = MATCH_STAGE_LABEL;

  activeTab = signal<'fases' | 'partidos' | 'csv'>('fases');

  // ── Partidos ─────────────────────────────────────────────
  matches = signal<MatchRow[]>([]);
  loadingMatches = signal(true);
  resultForm: Record<number, ResultForm> = {};

  // ── CSV ──────────────────────────────────────────────────
  csvResults = signal<CsvImportResult[] | null>(null);
  csvError = signal<string | null>(null);
  csvImporting = signal(false);

  get isGroupPhaseActive(): boolean { return this.configService.isGroupPhaseActive(); }
  get isKnockoutPhaseActive(): boolean { return this.configService.isKnockoutPhaseActive(); }

  ngOnInit(): void {
    this.groupService.ensureLoaded().subscribe();
    this._loadMatches();
  }

  setTab(tab: 'fases' | 'partidos' | 'csv'): void {
    this.activeTab.set(tab);
  }

  toggleGroupPhase(): void {
    this.configService.setGroupPhase(!this.isGroupPhaseActive);
  }

  toggleKnockoutPhase(): void {
    this.configService.setKnockoutPhase(!this.isKnockoutPhaseActive);
  }

  isStageActive(stageId: number): boolean {
    return this.configService.isKnockoutStageActive(stageId);
  }

  toggleStage(stageId: number): void {
    this.configService.setKnockoutStage(stageId, !this.isStageActive(stageId));
  }

  teamName(countryId: number, fallback?: string): string {
    return this.groupService.countryName(countryId, fallback);
  }

  toggleMatchLock(match: MatchRow): void {
    const action$ = match.isLocked
      ? this.matchService.unlockMatch(match.matchId)
      : this.matchService.lockMatch(match.matchId);

    action$.subscribe({
      next: () => this._loadMatches(),
    });
  }

  saveResult(match: MatchRow): void {
    const form = this.resultForm[match.matchId];
    if (form?.homeScore == null || form?.awayScore == null || form?.winnerTeamId == null || form?.penalties == null) return;

    this.matchService.updateMatch(
      match.matchId, form.homeScore, form.awayScore, form.penalties ? 1 : 0,
      form.winnerTeamId, /* matchStatusId (suposición: 2 = jugado) */ 2, match.isLocked ? 1 : 0
    ).subscribe({
      next: () => this._loadMatches(),
    });
  }

  updateResultForm(matchId: number, partial: Partial<ResultForm>): void {
    this.resultForm[matchId] = { ...this._emptyResultForm(), ...this.resultForm[matchId], ...partial };
  }

  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.csvError.set(null);
    this.csvResults.set(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const rows = this.csvImportService.parseCsv(text);
        this.csvImporting.set(true);
        this.csvImportService.importRows(rows).subscribe({
          next: (results) => {
            this.csvResults.set(results);
            this.csvImporting.set(false);
            this._loadMatches();
          },
          error: (err) => {
            this.csvError.set(err?.message ?? 'Error al importar el CSV.');
            this.csvImporting.set(false);
          },
        });
      } catch (err) {
        this.csvError.set((err as Error).message);
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  private _emptyResultForm(): ResultForm {
    return { homeScore: null, awayScore: null, penalties: null, winnerTeamId: null };
  }

  private _loadMatches(): void {
    this.loadingMatches.set(true);
    this.matchService.getMatches().subscribe({
      next: (raw) => {
        const matches: MatchRow[] = (raw ?? []).map(r => ({
          matchId:      Number(r['matchId'] ?? r['match_id']),
          homeTeamId:   Number(r['homeTeamId'] ?? r['home_team_id']),
          awayTeamId:   Number(r['awayTeamId'] ?? r['away_team_id']),
          homeTeamName: String(r['homeTeamName'] ?? r['home_team_name'] ?? ''),
          awayTeamName: String(r['awayTeamName'] ?? r['away_team_name'] ?? ''),
          kickOffTime:  String(r['kickOffTime'] ?? r['kick_off_time'] ?? ''),
          isLocked:     Number(r['isLocked'] ?? r['is_locked']) === 1,
        })).filter(m => !!m.matchId);

        this.matches.set(matches);
        this.loadingMatches.set(false);
      },
      error: () => this.loadingMatches.set(false),
    });
  }
}
