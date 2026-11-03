import { describe, expect, it } from 'vitest';
import { combatantViewMaxItems, combatantViewMinItems } from '../config';
import {
  clampItemsPerView,
  clampPage,
  findCurrentTurnIndex,
  pageCount,
  pageForCombatantIndex,
  pageSlice,
} from '../combatantView';

describe('combatantView', () => {
  it('clampItemsPerView_AbaixoDoMinimo_RetornaMinimo', () => {
    expect(clampItemsPerView(0)).toBe(combatantViewMinItems);
    expect(clampItemsPerView(-4.8)).toBe(combatantViewMinItems);
    expect(clampItemsPerView(Number.NaN)).toBe(2);
  });

  it('clampItemsPerView_AcimaDoMaximo_RetornaMaximo', () => {
    expect(clampItemsPerView(combatantViewMaxItems + 3)).toBe(combatantViewMaxItems);
    expect(clampItemsPerView(9.2)).toBe(combatantViewMaxItems);
  });

  it('clampItemsPerView_FracionarioNoIntervalo_Trunca', () => {
    expect(clampItemsPerView(2.9)).toBe(2);
    expect(clampItemsPerView(4)).toBe(4);
  });

  it('pageCount_SemItens_RetornaUma', () => {
    expect(pageCount(0, 2)).toBe(1);
    expect(pageCount(-5, 2)).toBe(1);
  });

  it('pageCount_DivisaoExata_RetornaQuociente', () => {
    expect(pageCount(6, 2)).toBe(3);
  });

  it('pageCount_ComResto_ArredondaParaCima', () => {
    expect(pageCount(5, 2)).toBe(3);
  });

  it('pageSlice_PrimeiraPagina_RetornaInicio', () => {
    expect(pageSlice(['a', 'b', 'c', 'd'], 1, 2)).toEqual(['a', 'b']);
  });

  it('pageSlice_PaginaDoMeio_RetornaFatia', () => {
    expect(pageSlice(['a', 'b', 'c', 'd', 'e'], 2, 2)).toEqual(['c', 'd']);
  });

  it('pageSlice_UltimaPaginaIncompleta_RetornaResto', () => {
    expect(pageSlice(['a', 'b', 'c', 'd', 'e'], 3, 2)).toEqual(['e']);
  });

  it('pageSlice_PaginaAlemDoTotal_RetornaUltima', () => {
    expect(pageSlice(['a', 'b', 'c'], 9, 2)).toEqual(['c']);
  });

  it('clampPage_AbaixoDeUm_RetornaUm', () => {
    expect(clampPage(0, 5, 2)).toBe(1);
    expect(clampPage(Number.NaN, 5, 2)).toBe(1);
  });

  it('clampPage_AcimaDoTotal_RetornaUltima', () => {
    expect(clampPage(8, 5, 2)).toBe(3);
  });

  it('findCurrentTurnIndex_ComTurnoVivo_RetornaIndice', () => {
    expect(
      findCurrentTurnIndex([
        { isCurrentTurn: false, isDead: false },
        { isCurrentTurn: true, isDead: false },
      ]),
    ).toBe(1);
  });

  it('findCurrentTurnIndex_TurnoMortoEOutroVivo_PrefereVivo', () => {
    expect(
      findCurrentTurnIndex([
        { isCurrentTurn: true, isDead: true },
        { isCurrentTurn: false },
        { isCurrentTurn: true },
      ]),
    ).toBe(2);
  });

  it('findCurrentTurnIndex_DoisVivos_PrimeiroIndice', () => {
    expect(
      findCurrentTurnIndex([
        { isCurrentTurn: true, isDead: false },
        { isCurrentTurn: true, isDead: false },
      ]),
    ).toBe(0);
  });

  it('findCurrentTurnIndex_SoTurnoMorto_RetornaMenosUm', () => {
    expect(
      findCurrentTurnIndex([
        { isCurrentTurn: false, isDead: true },
        { isCurrentTurn: true, isDead: true },
        { isCurrentTurn: true, isDead: true },
      ]),
    ).toBe(-1);
  });

  it('findCurrentTurnIndex_SemTurno_RetornaMenosUm', () => {
    expect(findCurrentTurnIndex([])).toBe(-1);
    expect(findCurrentTurnIndex([{ isCurrentTurn: false }, { isCurrentTurn: false }])).toBe(-1);
  });

  it('pageForCombatantIndex_IndiceNegativo_RetornaUm', () => {
    expect(pageForCombatantIndex(-1, 3)).toBe(1);
    expect(pageForCombatantIndex(Number.NaN, 2)).toBe(1);
  });

  it('pageForCombatantIndex_IndiceNaPagina_RetornaPagina', () => {
    expect(pageForCombatantIndex(0, 2)).toBe(1);
    expect(pageForCombatantIndex(1, 2)).toBe(1);
    expect(pageForCombatantIndex(2, 2)).toBe(2);
    expect(pageForCombatantIndex(5, 2)).toBe(3);
  });

  it('pageForCombatantIndex_ItemsPorViewForaDoLimite_UsaLimite', () => {
    expect(pageForCombatantIndex(6, combatantViewMaxItems + 10)).toBe(2);
    expect(pageForCombatantIndex(1, 0)).toBe(2);
  });
});
