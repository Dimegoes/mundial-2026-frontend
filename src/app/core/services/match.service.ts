import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // POST /match/create-match
  createMatch(
    homeTeamId: number, awayTeamId: number, kickOffTime: string, 
    matchStatusId: number, matchStageId: number, opensAt: string, 
    closesAt: string, isLocked: number
  ): Observable<Record<string, unknown>> {
    const params = new HttpParams()
      .set('homeTeamId', homeTeamId.toString())
      .set('awayTeamId', awayTeamId.toString())
      .set('kickOffTime', kickOffTime)
      .set('matchStatusId', matchStatusId.toString())
      .set('matchStageId', matchStageId.toString())
      .set('opensAt', opensAt)
      .set('closesAt', closesAt)
      .set('isLocked', isLocked.toString());

    return this.http.post<Record<string, unknown>>(
      `${this.baseUrl}/match/create-match`, null, { params }
    );
  }

  // PUT /match/update-match
  updateMatch(
    matchId: number, homeScore: number, awayScore: number, 
    penalties: number, winnerTeamId: number, matchStatusId: number, 
    isLocked: number
  ): Observable<Record<string, unknown>> {
    const params = new HttpParams()
      .set('matchId', matchId.toString())
      .set('homeScore', homeScore.toString())
      .set('awayScore', awayScore.toString())
      .set('penalties', penalties.toString())
      .set('winnerTeamId', winnerTeamId.toString())
      .set('matchStatusId', matchStatusId.toString())
      .set('isLocked', isLocked.toString());

    return this.http.put<Record<string, unknown>>(
      `${this.baseUrl}/match/update-match`, null, { params }
    );
  }

  // PUT /match/unlock
  unlockMatch(matchId: number): Observable<Record<string, unknown>> {
    const params = new HttpParams().set('matchId', matchId.toString());
    return this.http.put<Record<string, unknown>>(`${this.baseUrl}/match/unlock`, null, { params });
  }

  // PUT /match/lock
  lockMatch(matchId: number): Observable<Record<string, unknown>> {
    const params = new HttpParams().set('matchId', matchId.toString());
    return this.http.put<Record<string, unknown>>(`${this.baseUrl}/match/lock`, null, { params });
  }

  // GET /match/unlocked
  getMatchesUnlocked(): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.baseUrl}/match/unlocked`);
  }

  // GET /match/locked
  getMatchesLocked(): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.baseUrl}/match/locked`);
  }

  // GET /match/by-home-tam (Typo respetado)
  getMatchesByHomeTeam(countryId: number): Observable<Record<string, unknown>[]> {
    const params = new HttpParams().set('countryId', countryId.toString());
    return this.http.get<Record<string, unknown>[]>(`${this.baseUrl}/match/by-home-tam`, { params });
  }

  // GET /match/by-away-tam (Typo respetado)
  getMatchesByAwayTeam(countryId: number): Observable<Record<string, unknown>[]> {
    const params = new HttpParams().set('countryId', countryId.toString());
    return this.http.get<Record<string, unknown>[]>(`${this.baseUrl}/match/by-away-tam`, { params });
  }

  // GET /match/by-date
  getMatchesByDate(date: string): Observable<Record<string, unknown>[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<Record<string, unknown>[]>(`${this.baseUrl}/match/by-date`, { params });
  }

  // GET /match/all
  getMatches(): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.baseUrl}/match/all`);
  }
}
