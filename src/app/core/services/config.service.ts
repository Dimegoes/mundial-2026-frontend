import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppConfig } from '../models/domain.models';
import { KNOCKOUT_STAGE_ORDER } from '../data/match-stage.data';

const DEFAULT_CONFIG: AppConfig = {
  isGroupPhaseActive:    true,
  isKnockoutPhaseActive: true,
  knockoutStageActive:   KNOCKOUT_STAGE_ORDER.reduce(
    (acc, stageId) => ({ ...acc, [stageId]: false }), {} as Record<number, boolean>
  ),
};

/**
 * Servicio de configuración de fases — respaldado por GET/PUT /config
 * (tabla app_settings, ver SchemaInitializer.java del backend).
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private _config = signal<AppConfig>(DEFAULT_CONFIG);
  readonly config = this._config.asReadonly();

  constructor() {
    this.refresh().subscribe();
  }

  readonly isGroupPhaseActive    = () => this._config().isGroupPhaseActive;
  readonly isKnockoutPhaseActive = () => this._config().isKnockoutPhaseActive;

  isKnockoutStageActive(matchStageId: number): boolean {
    return !!this._config().knockoutStageActive[matchStageId];
  }

  refresh(): Observable<AppConfig> {
    return this.http.get<Record<string, string>>(`${this.baseUrl}/config/all`).pipe(
      map(raw => this._mapConfig(raw)),
      tap(config => this._config.set(config)),
    );
  }

  setGroupPhase(active: boolean): void {
    this._updateSetting('is_group_phase_active', active);
  }

  setKnockoutPhase(active: boolean): void {
    this._updateSetting('is_knockout_phase_active', active);
  }

  setKnockoutStage(matchStageId: number, active: boolean): void {
    this._updateSetting(`knockout_stage_${matchStageId}_active`, active);
  }

  private _updateSetting(key: string, active: boolean): void {
    const params = new HttpParams().set('key', key).set('value', active ? '1' : '0');
    this.http.put(`${this.baseUrl}/config/update`, null, { params }).subscribe({
      next: () => this.refresh().subscribe(),
    });
  }

  private _mapConfig(raw: Record<string, string>): AppConfig {
    const knockoutStageActive: Record<number, boolean> = {};
    KNOCKOUT_STAGE_ORDER.forEach(stageId => {
      knockoutStageActive[stageId] = raw[`knockout_stage_${stageId}_active`] === '1';
    });

    return {
      isGroupPhaseActive:    raw['is_group_phase_active'] === '1',
      isKnockoutPhaseActive: raw['is_knockout_phase_active'] === '1',
      knockoutStageActive,
    };
  }
}
