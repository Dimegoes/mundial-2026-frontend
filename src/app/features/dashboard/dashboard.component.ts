import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ConfigService } from '../../core/services/config.service';
import { AuthSession } from '../../core/models/domain.models';

const ANIM_PREF_KEY = 'mp_animations';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService   = inject(AuthService);
  private configService = inject(ConfigService);
  private router        = inject(Router);

  // ── Sesión ───────────────────────────────────────────────
  get session(): AuthSession | null { return this.authService.session(); }
  get isAdmin(): boolean            { return this.authService.isAdmin(); }

  // ── Feature flags ────────────────────────────────────────
  get isGroupPhaseActive():    boolean { return this.configService.isGroupPhaseActive(); }
  get isKnockoutPhaseActive(): boolean { return this.configService.isKnockoutPhaseActive(); }

  // ── Animaciones ──────────────────────────────────────────
  animationsEnabled = true;

  // Barrido verde
  showSweep   = false;
  sweepPhase: 'in' | 'out' = 'in';

  // Visibilidad de cards (cascada)
  cardsVisible: boolean[] = [false, false, false, false];
  private sweepTimeout: ReturnType<typeof setTimeout> | null = null;
  private cardTimeouts: ReturnType<typeof setTimeout>[] = [];

  // ── Menú usuario ─────────────────────────────────────────
  userMenuOpen = false;

  ngOnInit(): void {
    // Leer preferencia de animaciones
    const saved = localStorage.getItem(ANIM_PREF_KEY);
    this.animationsEnabled = saved !== 'false';

    if (this.animationsEnabled) {
      this._runEntryAnimation();
    } else {
      // Sin animación: todo visible de inmediato
      this.cardsVisible = [true, true, true, true];
    }
  }

  ngOnDestroy(): void {
    this._clearTimers();
  }

  toggleAnimations(): void {
    this.animationsEnabled = !this.animationsEnabled;
    localStorage.setItem(ANIM_PREF_KEY, String(this.animationsEnabled));

    if (!this.animationsEnabled) {
      this._clearTimers();
      this.showSweep  = false;
      this.cardsVisible = [true, true, true, true];
    }
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    this.authService.logout();
  }

  // ── Animación de entrada desactivada ─────────────────────────────────
  private _runEntryAnimation(): void {
    this.showSweep = false;
    this.cardsVisible = [true, true, true, true];
  }

  private _clearTimers(): void {
    if (this.sweepTimeout) clearTimeout(this.sweepTimeout);
    this.cardTimeouts.forEach(t => clearTimeout(t));
    this.cardTimeouts = [];
  }
}
