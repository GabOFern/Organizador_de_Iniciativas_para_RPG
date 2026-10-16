import type { SheetType } from './types';

export type SheetCategoryFilter = 'all' | SheetType;

export interface SheetFilterItem {
  name: string;
  playerName?: string | null;
  type: string;
}

export function filterSheets<T extends SheetFilterItem>(
  sheets: T[],
  options: { nameQuery: string; category: SheetCategoryFilter },
): T[] {
  const query = options.nameQuery.trim().toLocaleLowerCase();

  return sheets.filter((sheet) => {
    if (options.category !== 'all' && sheet.type !== options.category) {
      return false;
    }
    if (!query) {
      return true;
    }
    const name = sheet.name.toLocaleLowerCase();
    const playerName = (sheet.playerName ?? '').toLocaleLowerCase();
    return name.includes(query) || playerName.includes(query);
  });
}
