import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Country, Group } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private _groups = signal<Group[]>([]);
  private _countryById = signal<Record<number, Country>>({});
  private _loaded = signal(false);

  readonly groups = this._groups.asReadonly();
  readonly countryById = this._countryById.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  /** Carga (o recarga) los 12 grupos reales desde GET /group/all. */
  loadGroups(): Observable<Group[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.baseUrl}/group/all`).pipe(
      map(raw => this._mapGroups(raw)),
      tap(groups => {
        this._groups.set(groups);
        const map: Record<number, Country> = {};
        groups.forEach(g => g.countries.forEach(c => (map[c.countryId] = c)));
        this._countryById.set(map);
        this._loaded.set(true);
      }),
    );
  }

  /** Usa el cache si ya se cargó una vez; si no, dispara la carga. */
  ensureLoaded(): Observable<Group[]> {
    return this._loaded() ? of(this._groups()) : this.loadGroups();
  }

  /** Lookup síncrono — asume que ensureLoaded() ya se resolvió. */
  countryName(countryId: number, fallback?: string): string {
    return fallback || this._countryById()[countryId]?.name || `Equipo #${countryId}`;
  }

  private _mapGroups(raw: Record<string, unknown>[]): Group[] {
    return (raw ?? []).map(g => ({
      groupId: Number(g['groupId'] ?? g['group_id']),
      name: String(g['name'] ?? ''),
      countries: ((g['countries'] as Record<string, unknown>[]) ?? []).map(c => ({
        countryId: Number(c['countryId'] ?? c['country_id']),
        name: String(c['name'] ?? ''),
        fifaCode: String(c['fifaCode'] ?? c['fifa_code'] ?? ''),
        image: c['image'] ? String(c['image']) : undefined,
      })),
    }));
  }
}
