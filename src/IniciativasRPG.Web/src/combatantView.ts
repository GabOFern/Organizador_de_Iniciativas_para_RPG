import {
  combatantViewDefaultItems,
  combatantViewMaxItems,
  combatantViewMinItems,
} from './config';

export type CombatantViewMode = 'grid' | 'carousel';
export type CombatantFocusMode = 'turn' | 'free';

export function clampItemsPerView(value: number) {
  if (!Number.isFinite(value)) return combatantViewDefaultItems;
  return Math.min(combatantViewMaxItems, Math.max(combatantViewMinItems, Math.trunc(value)));
}

export function pageCount(itemCount: number, itemsPerView: number) {
  const perView = clampItemsPerView(itemsPerView);
  const count = Number.isFinite(itemCount) ? Math.max(0, Math.trunc(itemCount)) : 0;
  return Math.max(1, Math.ceil(count / perView));
}

export function clampPage(page: number, itemCount: number, itemsPerView: number) {
  const pages = pageCount(itemCount, itemsPerView);
  if (!Number.isFinite(page)) return 1;
  return Math.min(pages, Math.max(1, Math.trunc(page)));
}

export function pageForCombatantIndex(index: number, itemsPerView: number): number {
  if (!Number.isFinite(index) || index < 0) return 1;
  const perView = clampItemsPerView(itemsPerView);
  return clampPage(Math.floor(index / perView) + 1, Math.floor(index) + 1, perView);
}

export function findCurrentTurnIndex(
  combatants: { isCurrentTurn: boolean; isDead?: boolean }[],
): number {
  return combatants.findIndex((combatant) => combatant.isCurrentTurn && !combatant.isDead);
}

export function pageSlice<T>(items: T[], page: number, itemsPerView: number): T[] {
  const perView = clampItemsPerView(itemsPerView);
  const safePage = clampPage(page, items.length, perView);
  const start = (safePage - 1) * perView;
  return items.slice(start, start + perView);
}
