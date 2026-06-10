import { Injectable, signal } from '@angular/core';
import { AppConfig } from '../models/domain.models';

/**
 * Servicio de configuración de fases.
 * Por ahora los flags están hardcodeados — cuando el backend exponga
 * un endpoint GET /api/config, reemplaza init() con una llamada HTTP.
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  // ── Flags hardcodeados — CAMBIAR SEGÚN FASE ACTUAL ──────
  private _config = signal<AppConfig>({
    isGroupPhaseActive:    true,
    isKnockoutPhaseActive: true,
  });

  readonly config = this._config.asReadonly();

  // Expuestos individualmente para conveniencia en templates
  readonly isGroupPhaseActive    = () => this._config().isGroupPhaseActive;
  readonly isKnockoutPhaseActive = () => this._config().isKnockoutPhaseActive;

  /** Actualizar manualmente (ej. desde AdminComponent) */
  setGroupPhase(active: boolean): void {
    this._config.update(c => ({ ...c, isGroupPhaseActive: active }));
  }

  setKnockoutPhase(active: boolean): void {
    this._config.update(c => ({ ...c, isKnockoutPhaseActive: active }));
  }
}
