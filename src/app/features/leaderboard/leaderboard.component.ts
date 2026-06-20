import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { LeaderboardEntry } from '../../core/models/domain.models';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent implements OnInit {
  private auth = inject(AuthService);
  private leaderboardService = inject(LeaderboardService);

  loading = signal(true);
  errorMsg = signal<string | null>(null);
  rows = signal<LeaderboardEntry[]>([]);

  get currentUserId(): number | undefined {
    return this.auth.session()?.userId;
  }

  ngOnInit(): void {
    this.leaderboardService.getLeaderboard().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudo cargar la tabla de puntajes.');
        this.loading.set(false);
      },
    });
  }
}
