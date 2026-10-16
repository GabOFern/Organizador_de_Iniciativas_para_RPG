import { describe, expect, it } from 'vitest';
import { filterSheets, type SheetFilterItem } from '../sheetFilters';

const sheets: SheetFilterItem[] = [
  { name: 'Diana', playerName: 'Myka', type: 'Player' },
  { name: 'Esqueleto', playerName: null, type: 'Creature' },
  { name: 'Elara', playerName: null, type: 'Npc' },
];

describe('filterSheets', () => {
  it('filterSheets_Nome_IgnoraMaiusculasEEspacos', () => {
    expect(filterSheets(sheets, { nameQuery: '  ESQ ', category: 'all' }).map((sheet) => sheet.name))
      .toEqual(['Esqueleto']);
  });

  it('filterSheets_NomeDoJogador_EncontraAFicha', () => {
    expect(filterSheets(sheets, { nameQuery: 'myka', category: 'all' }).map((sheet) => sheet.name))
      .toEqual(['Diana']);
  });

  it('filterSheets_Categoria_RestringeOTipo', () => {
    expect(filterSheets(sheets, { nameQuery: '', category: 'Creature' }).map((sheet) => sheet.name))
      .toEqual(['Esqueleto']);
  });

  it('filterSheets_NomeECategoria_ExigeOsDois', () => {
    expect(filterSheets(sheets, { nameQuery: 'e', category: 'Npc' }).map((sheet) => sheet.name))
      .toEqual(['Elara']);
    expect(filterSheets(sheets, { nameQuery: 'e', category: 'Player' })).toEqual([]);
  });

  it('filterSheets_TodasSemTexto_RetornaTudo', () => {
    expect(filterSheets(sheets, { nameQuery: '   ', category: 'all' })).toHaveLength(3);
  });
});
