import { describe, expect, it } from 'vitest';
import {
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
    });
  });

  it('saveCombatantViewPrefs_RoundTrip_RestauraPrefs', () => {
    const storage = memoryStorage();
    saveCombatantViewPrefs({ mode: 'carousel', itemsPerView: 4 }, storage);
    expect(storage.map.get(combatantViewPrefsStorageKey)).toBeTruthy();
    expect(loadCombatantViewPrefs(storage)).toEqual({ mode: 'carousel', itemsPerView: 4 });
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
    });
  });

  it('loadCombatantViewPrefs_QuantidadeForaDoLimite_Limita', () => {
    const storage = memoryStorage({
      [combatantViewPrefsStorageKey]: JSON.stringify({ mode: 'grid', itemsPerView: 99 }),
    });
    expect(loadCombatantViewPrefs(storage).itemsPerView).toBe(combatantViewMaxItems);
  });
});
