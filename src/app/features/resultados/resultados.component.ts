import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatchService } from '../../core/services/match.service';
import { GroupService } from '../../core/services/group.service';
import { KNOCKOUT_STAGE_ORDER, MatchStageId, MATCH_STAGE_LABEL } from '../../core/data/match-stage.data';

interface ResultView {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  kickOffTime: string;
  matchStageId: number;
  homeScore: number | null;
  awayScore: number | null;
  penalties: boolean | null;
  winnerTeamId: number | null;
  played: boolean;
}

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './resultados.component.html',
  styleUrl: './resultados.component.scss',
})
export class ResultadosComponent implements OnInit {
  private matchService = inject(MatchService);
  private groupService = inject(GroupService);

  readonly stageLabel = MATCH_STAGE_LABEL;
  readonly allStages = [MatchStageId.GROUP, ...KNOCKOUT_STAGE_ORDER];

  loading = signal(true);
  errorMsg = signal<string | null>(null);
  results = signal<ResultView[]>([]);

  readonly resultsByStage = computed<Record<number, ResultView[]>>(() => {
    const grouped: Record<number, ResultView[]> = {};
    this.results().forEach(r => {
      grouped[r.matchStageId] = grouped[r.matchStageId] ?? [];
      grouped[r.matchStageId].push(r);
    });
    Object.values(grouped).forEach(list =>
      list.sort((a, b) => new Date(a.kickOffTime).getTime() - new Date(b.kickOffTime).getTime())
    );
    return grouped;
  });

  ngOnInit(): void {
    this.groupService.ensureLoaded().subscribe();
    this.matchService.getMatches().subscribe({
      next: (raw) => {
        const results: ResultView[] = (raw ?? []).map(r => {
          const homeScore = r['homeScore'] ?? r['home_score'];
          const awayScore = r['awayScore'] ?? r['away_score'];
          return {
            matchId:      Number(r['matchId'] ?? r['match_id']),
            homeTeamId:   Number(r['homeTeamId'] ?? r['home_team_id']),
            awayTeamId:   Number(r['awayTeamId'] ?? r['away_team_id']),
            homeTeamName: String(r['homeTeamName'] ?? r['home_team_name'] ?? ''),
            awayTeamName: String(r['awayTeamName'] ?? r['away_team_name'] ?? ''),
            kickOffTime:  String(r['kickOffTime'] ?? r['kick_off_time'] ?? r['kickoffTime'] ?? ''),
            matchStageId: Number(r['matchStageId'] ?? r['match_stage_id']),
            homeScore:    homeScore == null ? null : Number(homeScore),
            awayScore:    awayScore == null ? null : Number(awayScore),
            penalties:    (r['penalties'] ?? r['penalties']) == null ? null : Number(r['penalties']) === 1,
            winnerTeamId: (r['winnerTeamId'] ?? r['winner_team_id']) == null ? null : Number(r['winnerTeamId'] ?? r['winner_team_id']),
            played:       homeScore != null && awayScore != null,
          };
        }).filter(m => !!m.matchId);

        this.results.set(results);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudieron cargar los resultados.');
        this.loading.set(false);
      },
    });
  }

  teamName(countryId: number, fallback?: string): string {
    return this.groupService.countryName(countryId, fallback);
  }
}
