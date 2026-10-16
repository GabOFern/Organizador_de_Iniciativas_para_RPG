import { describe, expect, it } from 'vitest';
import { lineupMaxQuantity } from '../config';
import { clampLineupQuantity, expandLineupInvokeRows } from '../lineupQuantity';

describe('lineupQuantity', () => {
  it('clampLineupQuantity_Jogador_ParaEmUm', () => {
    expect(clampLineupQuantity(2, 'Player')).toBe(1);
    expect(clampLineupQuantity(-3, 'Player')).toBe(0);
  });

  it('clampLineupQuantity_Criatura_RespeitaOMaximo', () => {
    expect(clampLineupQuantity(lineupMaxQuantity + 5, 'Creature')).toBe(lineupMaxQuantity);
    expect(clampLineupQuantity(3.8, 'Npc')).toBe(3);
  });

  it('expandLineupInvokeRows_Quantidade_AbreUmaLinhaPorCopia', () => {
    const rows = expandLineupInvokeRows([
      { sheetId: 'bell', sheetName: 'Sino', initiativeBonus: 0, quantity: 3, sortOrder: 0 },
    ]);

    expect(rows.map((row) => row.name)).toEqual(['Sino 1', 'Sino 2', 'Sino 3']);
    expect(rows.every((row) => row.sheetId === 'bell')).toBe(true);
  });

  it('expandLineupInvokeRows_UmaCopia_MantemONome', () => {
    const rows = expandLineupInvokeRows([
      { sheetId: 'diana', sheetName: 'Diana', initiativeBonus: 2, quantity: 1, sortOrder: 1 },
      { sheetId: 'howl', sheetName: 'Howl', initiativeBonus: 1, quantity: 1, sortOrder: 0 },
    ]);

    expect(rows.map((row) => row.name)).toEqual(['Howl', 'Diana']);
  });
});