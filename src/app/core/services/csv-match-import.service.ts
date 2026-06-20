import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MatchService } from './match.service';
import { GroupService } from './group.service';
import { MatchStageId } from '../data/match-stage.data';

export interface CsvImportRow {
  round: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
}

export interface CsvImportResult {
  row: CsvImportRow;
  ok: boolean;
  error?: string;
}

/**
 * Importación de partidos desde CSV — 100% frontend.
 *
 * El backend NO tiene endpoint de importación masiva, pero SÍ tiene
 * POST /match/create-match para un partido a la vez. Esta implementación
 * parsea el CSV en el navegador y llama a ese endpoint una vez por fila
 * — evita tener que tocar el backend para esta funcionalidad.
 *
 * El mapeo "nombre de equipo -> country_id" usa los grupos/países REALES
 * vía GroupService (GET /group/all). El mapeo "ronda -> matchStageId"
 * sigue siendo una SUPOSICIÓN sin tabla de lookup en el backend.
 */
const ROUND_TO_STAGE_ID: Record<string, number> = {
  group:         MatchStageId.GROUP,
  groups:        MatchStageId.GROUP,
  round32:       MatchStageId.ROUND_OF_32,
  'round-32':    MatchStageId.ROUND_OF_32,
  dieciseisavos: MatchStageId.ROUND_OF_32,
  round16:       MatchStageId.ROUND_OF_16,
  'round-16':    MatchStageId.ROUND_OF_16,
  octavos:       MatchStageId.ROUND_OF_16,
  quarter:       MatchStageId.QUARTER,
  quarterfinal:  MatchStageId.QUARTER,
  cuartos:       MatchStageId.QUARTER,
  semi:          MatchStageId.SEMI,
  semifinal:     MatchStageId.SEMI,
  semis:         MatchStageId.SEMI,
  final:         MatchStageId.FINAL,
};

@Injectable({ providedIn: 'root' })
export class CsvMatchImportService {
  private matchService = inject(MatchService);
  private groupService = inject(GroupService);

  parseCsv(text: string): CsvImportRow[] {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (!lines.length) return [];

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const idxRound   = header.indexOf('round');
    const idxHome    = header.indexOf('home_team');
    const idxAway    = header.indexOf('away_team');
    const idxKickoff = header.indexOf('kickoff_time');

    if (idxRound < 0 || idxHome < 0 || idxAway < 0 || idxKickoff < 0) {
      throw new Error('El CSV debe tener las columnas: round, home_team, away_team, kickoff_time');
    }

    return lines.slice(1).map(line => {
      const cols = line.split(',').map(c => c.trim());
      return {
        round: cols[idxRound],
        homeTeam: cols[idxHome],
        awayTeam: cols[idxAway],
        kickoffTime: cols[idxKickoff],
      };
    });
  }

  resolveCountryId(teamName: string): number | undefined {
    const needle = teamName.trim().toLowerCase();
    for (const country of Object.values(this.groupService.countryById())) {
      if (country.name.toLowerCase() === needle || country.fifaCode.toLowerCase() === needle) {
        return country.countryId;
      }
    }
    return undefined;
  }

  resolveStageId(round: string): number | undefined {
    return ROUND_TO_STAGE_ID[round.trim().toLowerCase()];
  }

  /** Crea un partido por fila vía POST /match/create-match. Una fila que falla no detiene al resto. */
  importRows(rows: CsvImportRow[]): Observable<CsvImportResult[]> {
    if (!rows.length) return of([]);
    return this.groupService.ensureLoaded().pipe(
      switchMap(() => forkJoin(rows.map(row => this._importRow(row)))),
    );
  }

  private _importRow(row: CsvImportRow): Observable<CsvImportResult> {
    const homeTeamId = this.resolveCountryId(row.homeTeam);
    const awayTeamId = this.resolveCountryId(row.awayTeam);
    const matchStageId = this.resolveStageId(row.round);
    const kickOffIso = this._toIsoDate(row.kickoffTime);

    if (!homeTeamId || !awayTeamId || !matchStageId || !kickOffIso) {
      const missing = [
        !homeTeamId && `equipo local "${row.homeTeam}"`,
        !awayTeamId && `equipo visitante "${row.awayTeam}"`,
        !matchStageId && `ronda "${row.round}"`,
        !kickOffIso && `fecha "${row.kickoffTime}"`,
      ].filter(Boolean).join(', ');
      return of({ row, ok: false, error: `No se pudo resolver: ${missing}` });
    }

    return this.matchService.createMatch(
      homeTeamId, awayTeamId, kickOffIso, /* matchStatusId (suposición) */ 1, matchStageId, kickOffIso, kickOffIso, 0
    ).pipe(
      map(() => ({ row, ok: true } as CsvImportResult)),
      catchError(err => of({ row, ok: false, error: err?.error?.message ?? 'Error del servidor' } as CsvImportResult)),
    );
  }

  private _toIsoDate(value: string): string | null {
    // Espera "YYYY-MM-DD HH:MM" interpretado SIEMPRE como hora peruana
    // (UTC-5 fijo, Perú no usa horario de verano) — sin importar la zona
    // horaria del navegador de quien hace la importación. `new Date(str)`
    // sin offset usaría la timezone LOCAL del navegador, lo cual rompía
    // el bloqueo automático 1h-antes-del-kickoff para usuarios en otras
    // zonas horarias. Por eso parseamos a mano y sumamos 5h para UTC.
    const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
    if (!m) return null;

    const [, year, month, day, hour, minute] = m;
    const utcMs = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) + 5, Number(minute));
    return new Date(utcMs).toISOString();
  }
}
