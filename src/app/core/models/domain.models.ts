// ── User ────────────────────────────────────────────────────
export interface User {
  userId: number;
  email: string;
  username?: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
}

export interface UserProfile {
  userId: number;
  name: string;
  alias: string;
  icon: string; // URL, nombre de archivo, o clave de avatar predefinido
}

export interface AuthSession {
  userId: number;
  email?: string;
  username?: string;
  alias?: string;
  icon?: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
  loggedAt: number; // timestamp
}

// Tipos de login — confirmar con backend: 1=username, 2=email (o al revés)
export enum LoginType {
  USERNAME = 1,
  EMAIL    = 2,
}

// ── Config / Feature Flags ───────────────────────────────────
export interface AppConfig {
  isGroupPhaseActive:   boolean;
  isKnockoutPhaseActive: boolean;
}

// ── Match ────────────────────────────────────────────────────
export interface Match {
  matchId:       number;
  homeTeamId:    number;
  awayTeamId:    number;
  homeTeamName?: string;
  awayTeamName?: string;
  homeScore?:    number;
  awayScore?:    number;
  kickOffTime:   string; // ISO 8601
  matchStatusId: number;
  matchStageId:  number;
  isLocked:      number; // 0 | 1
  opensAt?:      string;
  closesAt?:     string;
  winnerTeamId?: number;
  penalties?:    number;
}

export type MatchStage =
  | 'GROUP'
  | 'ROUND_OF_16'
  | 'QUARTER'
  | 'SEMI'
  | 'THIRD_PLACE'
  | 'FINAL';

// ── Prediction ───────────────────────────────────────────────
export interface GroupPrediction {
  predictionId?:  number;
  userId:         number;
  groupId:        number;
  firstPlaceId:   number;
  secondPlaceId:  number;
}

export interface BestThird {
  userBestThirdId?: number;
  userId:           number;
  countryId:        number;
}

export interface KnockoutPrediction {
  predictionId?:   number;
  matchId:         number;
  userId:          number;
  scoreTeamA:      number;
  scoreTeamB:      number;
  advancingTeamId: number;
  hasPenalties:    boolean;
}

// ── Leaderboard ──────────────────────────────────────────────
export interface LeaderboardEntry {
  userId:      number;
  alias:       string;
  icon:        string;
  totalPoints: number;
  rank:        number;
}
