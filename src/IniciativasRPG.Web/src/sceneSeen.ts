import { sceneSeenStorageKeyPrefix } from './config';

export function sceneSeenStorageKey(publicToken: string) {
  return `${sceneSeenStorageKeyPrefix}${publicToken}`;
}

export function loadSeenIds(
  publicToken: string,
  storage: Pick<Storage, 'getItem'> = localStorage,
): Set<string> {
  try {
    const raw = storage.getItem(sceneSeenStorageKey(publicToken));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export function saveSeenIds(
  publicToken: string,
  seen: Iterable<string>,
  storage: Pick<Storage, 'setItem'> = localStorage,
) {
  storage.setItem(sceneSeenStorageKey(publicToken), JSON.stringify([...seen]));
}

export function markSceneSeen(
  publicToken: string,
  sceneId: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): Set<string> {
  const seen = loadSeenIds(publicToken, storage);
  seen.add(sceneId);
  saveSeenIds(publicToken, seen, storage);
  return seen;
}

/**
 * Ids que entraram de novo na lista pública deixam de ser "vistos"
 * (re-liberação pelo mestre conta como nova).
 */
export function reconcileSeenOnVisibleChange(
  prevVisibleIds: Iterable<string>,
  nextVisibleIds: Iterable<string>,
  seen: Iterable<string>,
): Set<string> {
  const prev = new Set(prevVisibleIds);
  const next = new Set(nextVisibleIds);
  const result = new Set(seen);

  for (const id of next) {
    if (!prev.has(id)) {
      result.delete(id);
    }
  }

  return result;
}

export function countUnseen(visibleIds: Iterable<string>, seen: Iterable<string>): number {
  const seenSet = seen instanceof Set ? seen : new Set(seen);
  let count = 0;
  for (const id of visibleIds) {
    if (!seenSet.has(id)) count += 1;
  }
  return count;
}

export function isSceneUnseen(sceneId: string, seen: Iterable<string>): boolean {
  const seenSet = seen instanceof Set ? seen : new Set(seen);
  return !seenSet.has(sceneId);
}
