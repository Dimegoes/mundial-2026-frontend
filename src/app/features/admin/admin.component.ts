import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div style="min-height:100vh;background:var(--clr-bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;padding:20px;">
      <h1 style="font-family:var(--font-display);font-size:2.2rem;color:var(--clr-primary);text-align:center;">Panel Admin</h1>
      <p style="color:var(--clr-text-secondary);">Módulo en construcción — próxima iteración</p>
      <a routerLink="/dashboard" style="color:var(--clr-primary);font-weight:600;text-decoration:none;">← Volver al Dashboard</a>
    </div>
  `,
})
export class AdminComponent {}
