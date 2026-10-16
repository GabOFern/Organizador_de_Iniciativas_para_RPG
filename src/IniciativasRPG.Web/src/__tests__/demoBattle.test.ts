import { describe, expect, it } from 'vitest';
import { shouldRunTestBattleTicks, TEST_BATTLE_TICK_MS } from '../demoBattle';

describe('demoBattle', () => {
  it('expõe intervalo de 5 segundos', () => {
    expect(TEST_BATTLE_TICK_MS).toBe(5000);
  });

  it('shouldRunTestBattleTicks_ActiveAndFlag_ReturnsTrue', () => {
    expect(shouldRunTestBattleTicks('Active', true)).toBe(true);
  });

  it('shouldRunTestBattleTicks_Finished_ReturnsFalse', () => {
    expect(shouldRunTestBattleTicks('Finished', true)).toBe(false);
  });

  it('shouldRunTestBattleTicks_ActiveWithoutFlag_ReturnsFalse', () => {
    expect(shouldRunTestBattleTicks('Active', false)).toBe(false);
    expect(shouldRunTestBattleTicks('Active', undefined)).toBe(false);
  });

  it('shouldRunTestBattleTicks_Preparing_ReturnsFalse', () => {
    expect(shouldRunTestBattleTicks('Preparing', true)).toBe(false);
  });
});
