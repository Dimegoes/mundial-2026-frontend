import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LeaderboardEntry } from '../models/domain.models';

/**
 * Leaderboard calculado en el backend (ver LeaderboardController.java /
 * LeaderboardService.java) — antes se calculaba en el frontend con datos
 * mock, ya no es necesario.
 */
@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // GET /leaderboard/all
  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.baseUrl}/leaderboard/all`).pipe(
      map(raw => (raw ?? []).map(r => ({
        userId: Number(r['userId'] ?? r['user_id']),
        alias: String(r['alias'] ?? `Usuario #${r['userId'] ?? r['user_id']}`),
        totalPoints: Number(r['totalPoints'] ?? r['total_points'] ?? 0),
        rank: Number(r['rank'] ?? 0),
      }))),
    );
  }
}
