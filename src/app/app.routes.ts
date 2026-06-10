import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // ── Auth ──────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },

  // ── App (rutas protegidas) ────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'grupos',
        loadComponent: () =>
          import('./features/grupos/grupos.component').then(m => m.GruposComponent)
      },
      {
        path: 'eliminatorias',
        loadComponent: () =>
          import('./features/eliminatorias/eliminatorias.component').then(m => m.EliminatoriasComponent)
      },
      {
        path: 'leaderboard',
        loadComponent: () =>
          import('./features/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent)
      },
      {
        path: 'resultados',
        loadComponent: () =>
          import('./features/resultados/resultados.component').then(m => m.ResultadosComponent)
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./features/admin/admin.component').then(m => m.AdminComponent)
      }
    ]
  },

  // ── Fallback ──────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'login'
  }
];
