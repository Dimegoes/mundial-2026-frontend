import { MatchStageId } from '../data/match-stage.data';

/**
 * Reglas de puntaje — solo referencia. El cálculo real ocurre en
 * LeaderboardService.java del backend. Este archivo NO afecta los puntos.
 *
 * Eliminatorias — puntaje BASE por partido (máximo 8 pts):
 *   Marcador exacto (90 min): 2 pts  — CUMULATIVO con clasificado
 *   Equipo clasificado:        5 pts  — CUMULATIVO con marcador
 *   Penales sí/no:             1 pt
 * Luego se multiplica por el multiplicador de ronda.
 */
export const SCORING_RULES = {
  grupos: {
    primeroYSegundoExacto: 3,
    equipoEnTop2SinOrden: 1,
    mejorTerceroAcertado: 1,
  },
  eliminatorias: {
    marcadorExacto: 2,
    clasificadoAcertado: 5,
    penalesAcertado: 1,
    maxBase: 8,
  },
  stageMultiplier: {
    [MatchStageId.ROUND_OF_32]: 1,
    [MatchStageId.ROUND_OF_16]: 1.5,
    [MatchStageId.QUARTER]:     1.5,
    [MatchStageId.SEMI]:        2,
    [MatchStageId.FINAL]:       3,
  } as Record<number, number>,
} as const;
