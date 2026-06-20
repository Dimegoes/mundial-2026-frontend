import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PredictionService } from '../../core/services/prediction.service';
import { ConfigService } from '../../core/services/config.service';
import { GroupService } from '../../core/services/group.service';
import { Country, Group } from '../../core/models/domain.models';

interface GroupPick {
  predictionId?: number;
  firstPlaceId?: number;
  secondPlaceId?: number;
}

interface ThirdPick {
  userBestThirdId?: number;
  selected: boolean;
}

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './grupos.component.html',
  styleUrl: './grupos.component.scss',
})
export class GruposComponent implements OnInit {
  private auth        = inject(AuthService);
  private predictionService = inject(PredictionService);
  private configService     = inject(ConfigService);
  private groupService      = inject(GroupService);

  groups = signal<Group[]>([]);

  loading = signal(true);
  saving  = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  picks = signal<Record<number, GroupPick>>({});
  thirds = signal<Record<number, ThirdPick>>({});

  get locked(): boolean {
    return !this.configService.isGroupPhaseActive();
  }

  /** Países que NO fueron elegidos como 1° ni 2° en ningún grupo -> candidatos a "mejor tercero". */
  readonly thirdCandidates = computed<Country[]>(() => {
    const picks = this.picks();
    const chosenIds = new Set<number>();
    Object.values(picks).forEach(p => {
      if (p.firstPlaceId) chosenIds.add(p.firstPlaceId);
      if (p.secondPlaceId) chosenIds.add(p.secondPlaceId);
    });
    return this.groups()
      .flatMap(g => g.countries)
      .filter(c => !chosenIds.has(c.countryId));
  });

  readonly thirdsSelectedCount = computed<number>(() => {
    const thirds = this.thirds();
    return Object.values(thirds).filter(t => t.selected).length;
  });

  readonly allGroupsComplete = computed<boolean>(() => {
    const picks = this.picks();
    const groups = this.groups();
    return groups.length > 0 && groups.every(g => {
      const p = picks[g.groupId];
      return !!p?.firstPlaceId && !!p?.secondPlaceId;
    });
  });

  readonly canSubmit = computed<boolean>(() =>
    this.allGroupsComplete() && this.thirdsSelectedCount() === 8 && !this.locked
  );

  ngOnInit(): void {
    this.groupService.ensureLoaded().subscribe({
      next: (groups) => this.groups.set(groups),
    });
    this._loadExistingPredictions();
  }

  onFirstPlaceChange(groupId: number, countryId: number | null): void {
    this._updatePick(groupId, { firstPlaceId: countryId ?? undefined });
  }

  onSecondPlaceChange(groupId: number, countryId: number | null): void {
    this._updatePick(groupId, { secondPlaceId: countryId ?? undefined });
  }

  toggleThird(countryId: number): void {
    if (this.locked) return;
    const current = this.thirds()[countryId];
    const isSelected = !!current?.selected;

    if (!isSelected && this.thirdsSelectedCount() >= 8) {
      this.errorMsg.set('Ya seleccionaste 8 de 8 mejores terceros. Quita uno antes de elegir otro.');
      return;
    }

    this.errorMsg.set(null);
    this.thirds.update(t => ({
      ...t,
      [countryId]: { ...t[countryId], selected: !isSelected },
    }));
  }

  isThirdSelected(countryId: number): boolean {
    return !!this.thirds()[countryId]?.selected;
  }

  submit(): void {
    if (!this.canSubmit() || this.saving()) return;
    const userId = this.auth.session()?.userId;
    if (!userId) return;

    this.saving.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const groupRequests = this.groups().map(g => {
      const pick = this.picks()[g.groupId];
      if (!pick?.firstPlaceId || !pick?.secondPlaceId) return null;

      return pick.predictionId
        ? this.predictionService.updateUserGroupPrediction(pick.predictionId, pick.firstPlaceId, pick.secondPlaceId)
        : this.predictionService.createUserGroupPrediction(userId, g.groupId, pick.firstPlaceId, pick.secondPlaceId);
    }).filter((r): r is NonNullable<typeof r> => r !== null);

    const thirdRequests = Object.entries(this.thirds())
      .filter(([, t]) => t.selected)
      .map(([countryId, t]) => {
        const cId = Number(countryId);
        return t.userBestThirdId
          ? this.predictionService.updateUserBestThird(t.userBestThirdId, userId, cId)
          : this.predictionService.createUserBestThird(userId, cId);
      });

    forkJoin([...groupRequests, ...thirdRequests]).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMsg.set('¡Predicción guardada con éxito!');
        this._loadExistingPredictions();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Ocurrió un error al guardar tu predicción.');
      },
    });
  }

  private _updatePick(groupId: number, partial: Partial<GroupPick>): void {
    if (this.locked) return;
    this.picks.update(p => ({
      ...p,
      [groupId]: { ...p[groupId], ...partial },
    }));
  }

  private _loadExistingPredictions(): void {
    const userId = this.auth.session()?.userId;
    if (!userId) { this.loading.set(false); return; }

    this.loading.set(true);

    forkJoin([
      this.predictionService.getUserGroupPrediction(userId),
      this.predictionService.getUserBestThird(userId),
    ]).subscribe({
      next: ([groupPreds, thirdPreds]) => {
        const picks: Record<number, GroupPick> = {};
        (groupPreds ?? []).forEach((raw) => {
          const groupId = Number(raw['groupId'] ?? raw['group_id']);
          if (!groupId) return;
          picks[groupId] = {
            predictionId:  Number(raw['predictionId'] ?? raw['prediction_id']) || undefined,
            firstPlaceId:  Number(raw['firstPlaceId'] ?? raw['first_place_id']) || undefined,
            secondPlaceId: Number(raw['secondPlaceId'] ?? raw['second_place_id']) || undefined,
          };
        });
        this.picks.set(picks);

        const thirds: Record<number, ThirdPick> = {};
        (thirdPreds ?? []).forEach((raw) => {
          const countryId = Number(raw['countryId'] ?? raw['country_id']);
          if (!countryId) return;
          thirds[countryId] = {
            userBestThirdId: Number(raw['userBestThirdId'] ?? raw['user_best_third_id']) || undefined,
            selected: true,
          };
        });
        this.thirds.set(thirds);

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
