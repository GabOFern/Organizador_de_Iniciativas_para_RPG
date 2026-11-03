import { useCallback, useState } from 'react';
import type { CombatantViewMode } from '../combatantView';
import { clampItemsPerView } from '../combatantView';
import {
  loadCombatantViewPrefs,
  saveCombatantViewPrefs,
  type CombatantViewPrefs,
} from '../combatantViewPrefs';

export function useCombatantViewPrefs(
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
) {
  const [prefs, setPrefs] = useState<CombatantViewPrefs>(() => loadCombatantViewPrefs(storage));

  const update = useCallback(
    (patch: Partial<CombatantViewPrefs>) => {
      setPrefs((current) => {
        const next: CombatantViewPrefs = {
          mode: patch.mode ?? current.mode,
          itemsPerView: clampItemsPerView(patch.itemsPerView ?? current.itemsPerView),
        };
        saveCombatantViewPrefs(next, storage);
        return next;
      });
    },
    [storage],
  );

  const setMode = useCallback(
    (mode: CombatantViewMode) => update({ mode }),
    [update],
  );

  const setItemsPerView = useCallback(
    (itemsPerView: number) => update({ itemsPerView }),
    [update],
  );

  return { prefs, setMode, setItemsPerView };
}
