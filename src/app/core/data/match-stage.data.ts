/**
 * matchStageId — el backend NO expone una tabla de lookup para esto
 * (los valores se guardan como enteros crudos en la tabla `matches`).
 * Estos valores son una SUPOSICIÓN basada en convención habitual.
 * Confirmar con backend antes de depender de ellos en producción.
 */
export enum MatchStageId {
  GROUP       = 1,
  ROUND_OF_32 = 2, // Dieciseisavos (Mundial 2026: 48 equipos -> ronda extra antes de octavos)
  ROUND_OF_16 = 3, // Octavos
  QUARTER     = 4,
  SEMI        = 5,
  FINAL       = 6,
}

export const MATCH_STAGE_LABEL: Record<number, string> = {
  [MatchStageId.GROUP]:       'Fase de Grupos',
  [MatchStageId.ROUND_OF_32]: 'Dieciseisavos',
  [MatchStageId.ROUND_OF_16]: 'Octavos',
  [MatchStageId.QUARTER]:     'Cuartos',
  [MatchStageId.SEMI]:        'Semifinales',
  [MatchStageId.FINAL]:       'Final',
};

/** Orden de las sub-fases eliminatorias para tabs/iteración. */
export const KNOCKOUT_STAGE_ORDER: number[] = [
  MatchStageId.ROUND_OF_32,
  MatchStageId.ROUND_OF_16,
  MatchStageId.QUARTER,
  MatchStageId.SEMI,
  MatchStageId.FINAL,
];
