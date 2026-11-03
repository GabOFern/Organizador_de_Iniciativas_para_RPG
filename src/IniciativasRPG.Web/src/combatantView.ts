import {
  combatantViewDefaultItems,
  combatantViewMaxItems,
  combatantViewMinItems,
} from './config';

export type CombatantViewMode = 'grid' | 'carousel';

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

export function pageSlice<T>(items: T[], page: number, itemsPerView: number): T[] {
  const perView = clampItemsPerView(itemsPerView);
  const safePage = clampPage(page, items.length, perView);
  const start = (safePage - 1) * perView;
  return items.slice(start, start + perView);
}
