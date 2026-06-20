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

// Tipos de login según el backend (sp_get_user_for_login):
// estaba invertido respecto a lo que asumía el frontend — corregido.
export enum LoginType {
  EMAIL    = 1,
  USERNAME = 2,
}

// ── Config / Feature Flags ───────────────────────────────────
// LIMITACIÓN CONOCIDA: el backend no tiene tabla/endpoint de config
// global (ver mundial-2026-service). Estos flags se persisten en
// localStorage del navegador del admin — NO se sincronizan entre
// usuarios/dispositivos. Es un apaño temporal hasta que se pida un
// endpoint real (ej. GET/PUT /config) al backend.
export interface AppConfig {
  isGroupPhaseActive:    boolean;
  isKnockoutPhaseActive: boolean;
  /** matchStageId -> habilitada para predicción */
  knockoutStageActive:   Record<number, boolean>;
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

// ── Grupos / Países (GET /group/all) ──────────────────────────
export interface Country {
  countryId: number;
  name:      string;
  fifaCode:  string;
  image?:    string;
}

export interface Group {
  groupId:   number;
  name:      string;
  countries: Country[];
}

// ── Leaderboard ──────────────────────────────────────────────
export interface LeaderboardEntry {
  userId:      number;
  alias:       string;
  totalPoints: number;
  rank:        number;
}
