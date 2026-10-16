/** Intervalo entre ticks da batalha teste (espelha DemoBattleRules.TickIntervalSeconds). */
export const TEST_BATTLE_TICK_MS = 5000;

export function shouldRunTestBattleTicks(
  status: string,
  isTestBattle: boolean | undefined,
): boolean {
  return status === 'Active' && Boolean(isTestBattle);
}
