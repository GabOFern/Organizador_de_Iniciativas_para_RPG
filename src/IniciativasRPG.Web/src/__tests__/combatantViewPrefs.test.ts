import { describe, expect, it } from 'vitest';
import type { CombatantFocusMode } from '../combatantView';
import {
  combatantViewDefaultFocusMode,
  combatantViewDefaultItems,
  combatantViewDefaultMode,
  combatantViewMaxItems,
  combatantViewPrefsStorageKey,
} from '../config';
import {
  defaultCombatantViewPrefs,
  loadCombatantViewPrefs,
  saveCombatantViewPrefs,
} from '../combatantViewPrefs';

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    map,
  };
}

describe('combatantViewPrefs', () => {
  it('loadCombatantViewPrefs_StorageVazio_RetornaPadrao', () => {
    const storage = memoryStorage();
    expect(loadCombatantViewPrefs(storage)).toEqual(defaultCombatantViewPrefs());
    expect(defaultCombatantViewPrefs()).toEqual({
      mode: combatantViewDefaultMode,
      itemsPerView: combatantViewDefaultItems,
      focusMode: combatantViewDefaultFocusMode,
    });
  });

  it('saveCombatantViewPrefs_RoundTrip_RestauraPrefs', () => {
    const storage = memoryStorage();
    saveCombatantViewPrefs(
      { mode: 'carousel', itemsPerView: 4, focusMode: 'turn' },
      storage,
    );
    expect(loadCombatantViewPrefs(storage)).toEqual({
      mode: 'carousel',
      itemsPerView: 4,
      focusMode: 'turn',
    });
  });

  it('loadCombatantViewPrefs_JsonInvalido_RetornaPadrao', () => {
    const storage = memoryStorage({
      [combatantViewPrefsStorageKey]: '{modo',
    });
    expect(loadCombatantViewPrefs(storage)).toEqual(defaultCombatantViewPrefs());
  });

  it('loadCombatantViewPrefs_ModoInvalido_UsaModoPadrao', () => {
    const storage = memoryStorage({
      [combatantViewPrefsStorageKey]: JSON.stringify({ mode: 'list', itemsPerView: 5 }),
    });
    expect(loadCombatantViewPrefs(storage)).toEqual({
      mode: combatantViewDefaultMode,
      itemsPerView: 5,
      focusMode: combatantViewDefaultFocusMode,
    });
  });

  it('loadCombatantViewPrefs_QuantidadeForaDoLimite_Limita', () => {
    const storage = memoryStorage({
      [combatantViewPrefsStorageKey]: JSON.stringify({ mode: 'grid', itemsPerView: 99 }),
    });
    expect(loadCombatantViewPrefs(storage).itemsPerView).toBe(combatantViewMaxItems);
  });

  it('loadCombatantViewPrefs_FocusAusente_Livre', () => {
    const storage = memoryStorage({
      [combatantViewPrefsStorageKey]: JSON.stringify({ mode: 'carousel', itemsPerView: 2 }),
    });
    expect(loadCombatantViewPrefs(storage).focusMode).toBe('free');
  });

  it('loadCombatantViewPrefs_FocoInvalido_UsaLivre', () => {
    const storage = memoryStorage({
      [combatantViewPrefsStorageKey]: JSON.stringify({
        mode: 'grid',
        itemsPerView: 2,
        focusMode: 'locked',
      }),
    });
    expect(loadCombatantViewPrefs(storage).focusMode).toBe('free');
  });

  it('saveCombatantViewPrefs_FocoInvalido_GravaLivre', () => {
    const storage = memoryStorage();
    saveCombatantViewPrefs(
      { mode: 'grid', itemsPerView: 2, focusMode: 'locked' as CombatantFocusMode },
      storage,
    );
    expect(loadCombatantViewPrefs(storage).focusMode).toBe('free');
  });
});
