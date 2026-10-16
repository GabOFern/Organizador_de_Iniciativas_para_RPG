export interface LineupInitiativeRow {
  roll: boolean;
  initiative: string;
}

export function lineupRowsReady(rows: LineupInitiativeRow[]) {
  return rows.length > 0 && rows.every((row) => row.roll || /^-?\d+$/.test(row.initiative.trim()));
}

export function lineupInitiativeNotation(bonus: number) {
  if (!bonus) return '1d20';
  return bonus > 0 ? `1d20+${bonus}` : `1d20${bonus}`;
}
