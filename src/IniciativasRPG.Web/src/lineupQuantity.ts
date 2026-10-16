import { lineupMaxPlayerQuantity, lineupMaxQuantity } from './config';

export interface LineupQuantityMember {
  sheetId: string;
  sheetName: string;
  initiativeBonus: number;
  quantity: number;
  sortOrder: number;
}

export interface LineupInvokeRow {
  sheetId: string;
  name: string;
  bonus: number;
}

export function lineupQuantityMax(type: string) {
  return type === 'Player' ? lineupMaxPlayerQuantity : lineupMaxQuantity;
}

export function clampLineupQuantity(value: number, type: string) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(lineupQuantityMax(type), Math.max(0, Math.trunc(value)));
}

export function expandLineupInvokeRows(members: LineupQuantityMember[]): LineupInvokeRow[] {
  return [...members]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((member) =>
      Array.from({ length: member.quantity }, (_, index) => ({
        sheetId: member.sheetId,
        name: member.quantity > 1 ? `${member.sheetName} ${index + 1}` : member.sheetName,
        bonus: member.initiativeBonus,
      })),
    );
}

export function formatLineupMemberSummary(name: string, quantity: number) {
  return quantity > 1 ? `${name} × ${quantity}` : name;
}
