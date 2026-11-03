import {
  clampItemsPerView,
  type CombatantFocusMode,
  type CombatantViewMode,
} from './combatantView';
import {
  combatantViewDefaultFocusMode,
  combatantViewDefaultItems,
  combatantViewDefaultMode,
  combatantViewPrefsStorageKey,
} from './config';

export interface CombatantViewPrefs {
  mode: CombatantViewMode;
  itemsPerView: number;
  focusMode: CombatantFocusMode;
}

export function defaultCombatantViewPrefs(): CombatantViewPrefs {
  return {
    mode: combatantViewDefaultMode,
    itemsPerView: combatantViewDefaultItems,
    focusMode: combatantViewDefaultFocusMode,
  };
}

function isCombatantViewMode(value: unknown): value is CombatantViewMode {
  return value === 'grid' || value === 'carousel';
}

function isCombatantFocusMode(value: unknown): value is CombatantFocusMode {
  return value === 'turn' || value === 'free';
}

export function loadCombatantViewPrefs(
  storage: Pick<Storage, 'getItem'> = localStorage,
): CombatantViewPrefs {
  try {
    const raw = storage.getItem(combatantViewPrefsStorageKey);
    if (!raw) return defaultCombatantViewPrefs();
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return defaultCombatantViewPrefs();
    }

    const record = parsed as Record<string, unknown>;
    return {
      mode: isCombatantViewMode(record.mode) ? record.mode : combatantViewDefaultMode,
      itemsPerView:
        typeof record.itemsPerView === 'number'
          ? clampItemsPerView(record.itemsPerView)
          : combatantViewDefaultItems,
      focusMode: isCombatantFocusMode(record.focusMode)
        ? record.focusMode
        : combatantViewDefaultFocusMode,
    };
  } catch {
    return defaultCombatantViewPrefs();
  }
}

export function saveCombatantViewPrefs(
  prefs: CombatantViewPrefs,
  storage: Pick<Storage, 'setItem'> = localStorage,
) {
  const normalized: CombatantViewPrefs = {
    mode: isCombatantViewMode(prefs.mode) ? prefs.mode : combatantViewDefaultMode,
    itemsPerView: clampItemsPerView(prefs.itemsPerView),
    focusMode: isCombatantFocusMode(prefs.focusMode)
      ? prefs.focusMode
      : combatantViewDefaultFocusMode,
  };
  storage.setItem(combatantViewPrefsStorageKey, JSON.stringify(normalized));
}
