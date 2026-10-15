import { describe, it, expect, beforeEach } from 'vitest';
import {
  countUnseen,
  isSceneUnseen,
  loadSeenIds,
  markSceneSeen,
  reconcileSeenOnVisibleChange,
  saveSeenIds,
  sceneSeenStorageKey,
} from '../sceneSeen';

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

describe('sceneSeen', () => {
  const token = 'tok-abc';

  beforeEach(() => {
    localStorage.clear();
  });

  it('countUnseen_ContaApenasNaoVistas', () => {
    expect(countUnseen(['a', 'b', 'c'], ['b'])).toBe(2);
    expect(countUnseen(['a'], ['a'])).toBe(0);
  });

  it('markSceneSeen_PersisteEZeraItemNoCount', () => {
    const storage = memoryStorage();
    markSceneSeen(token, 'scene-1', storage);
    const seen = loadSeenIds(token, storage);
    expect(seen.has('scene-1')).toBe(true);
    expect(countUnseen(['scene-1', 'scene-2'], seen)).toBe(1);
  });

  it('reconcileSeenOnVisibleChange_ReLiberacaoRemoveDoSeen', () => {
    const seen = new Set(['scene-1', 'scene-2']);
    const next = reconcileSeenOnVisibleChange(
      ['scene-2'],
      ['scene-1', 'scene-2'],
      seen,
    );
    expect(next.has('scene-1')).toBe(false);
    expect(next.has('scene-2')).toBe(true);
  });

  it('saveAndLoad_RoundTrip', () => {
    const storage = memoryStorage();
    saveSeenIds(token, ['x', 'y'], storage);
    expect(storage.map.get(sceneSeenStorageKey(token))).toBeTruthy();
    expect([...loadSeenIds(token, storage)].sort()).toEqual(['x', 'y']);
  });

  it('isSceneUnseen_ReflectsSet', () => {
    expect(isSceneUnseen('a', ['a'])).toBe(false);
    expect(isSceneUnseen('b', ['a'])).toBe(true);
  });
});
