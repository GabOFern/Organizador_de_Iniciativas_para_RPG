import { describe, expect, it } from 'vitest';
import { battleHubEvents } from '../battleHubEvents';
import { publicBattleHubFallbackMs } from '../config';
import { shouldUsePublicRestFallback } from '../publicBattleLoad';

describe('battleHubEvents', () => {
  it('espelha BattleUpdated e ScenesUpdated do BattleNotifier', () => {
    expect(battleHubEvents.battle).toBe('BattleUpdated');
    expect(battleHubEvents.scenes).toBe('ScenesUpdated');
  });
});

describe('publicBattleHubFallbackMs', () => {
  it('espera 4 segundos sem snapshot antes do GET REST', () => {
    expect(publicBattleHubFallbackMs).toBe(4000);
  });
});

describe('shouldUsePublicRestFallback', () => {
  const waiting = {
    hubFailed: false,
    receivedSnapshot: false,
    elapsedMs: 0,
    fallbackMs: publicBattleHubFallbackMs,
  };

  it('hub ativo sem snapshot antes do timeout não usa REST', () => {
    expect(shouldUsePublicRestFallback({ ...waiting, elapsedMs: 3999 })).toBe(false);
  });

  it('timeout sem snapshot usa REST', () => {
    expect(shouldUsePublicRestFallback({ ...waiting, elapsedMs: publicBattleHubFallbackMs })).toBe(
      true,
    );
    expect(shouldUsePublicRestFallback({ ...waiting, elapsedMs: 5000 })).toBe(true);
  });

  it('hub falho sem snapshot usa REST na hora', () => {
    expect(shouldUsePublicRestFallback({ ...waiting, hubFailed: true })).toBe(true);
  });

  it('snapshot já recebido dispensa REST mesmo com falha ou timeout', () => {
    expect(
      shouldUsePublicRestFallback({
        hubFailed: true,
        receivedSnapshot: true,
        elapsedMs: 9000,
        fallbackMs: publicBattleHubFallbackMs,
      }),
    ).toBe(false);
  });
});
