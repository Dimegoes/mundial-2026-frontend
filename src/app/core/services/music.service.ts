import { Injectable, signal } from '@angular/core';

/**
 * MusicService — ESQUELETO (implementación postpuesta)
 *
 * Arquitectura:
 * - Un único AudioContext / HTMLAudioElement para toda la app
 * - Se inicia en el primer gesto del usuario (click en "Iniciar sesión")
 *   para cumplir la política de autoplay de navegadores
 * - Estado reactivo: isPlaying, isMuted, volume
 * - El componente raíz (AppComponent) inyecta este servicio y renderiza
 *   el botón toggle 🔊/🔇 en la esquina superior derecha
 * - El archivo de audio debe colocarse en assets/audio/theme.mp3
 *
 * Cuando retomes esta feature:
 * 1. Descomenta el código de abajo
 * 2. Agrega el archivo de audio en src/assets/audio/theme.mp3
 * 3. Inyecta MusicService en LoginComponent y llama a init() al hacer submit
 */
@Injectable({ providedIn: 'root' })
export class MusicService {
  readonly isPlaying = signal(false);
  readonly isMuted   = signal(false);

  // private audio: HTMLAudioElement | null = null;

  /** Llamar en el primer gesto del usuario */
  init(): void {
    // this.audio = new Audio('assets/audio/theme.mp3');
    // this.audio.loop = true;
    // this.audio.volume = 0.4;
    // this.audio.play().then(() => this.isPlaying.set(true)).catch(() => {});
    console.info('[MusicService] Postpuesto — descomenta el código cuando tengas el archivo de audio');
  }

  toggle(): void {
    // if (!this.audio) return;
    // if (this.audio.paused) { this.audio.play(); this.isPlaying.set(true); }
    // else                   { this.audio.pause(); this.isPlaying.set(false); }
  }

  toggleMute(): void {
    // if (!this.audio) return;
    // this.audio.muted = !this.audio.muted;
    // this.isMuted.set(this.audio.muted);
  }
}
