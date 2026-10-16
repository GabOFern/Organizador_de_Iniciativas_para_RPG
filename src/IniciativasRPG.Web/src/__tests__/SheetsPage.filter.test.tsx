import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SheetsPage } from '../pages/SheetsPage';
import { sheetFilterCategoryLabel, sheetFilterEmptyMessage } from '../config';
import type { Sheet, SheetType } from '../types';

const { listSheets } = vi.hoisted(() => ({
  listSheets: vi.fn(),
}));

vi.mock('../api', () => ({
  api: {
    listSheets,
    createSheet: vi.fn(),
    updateSheet: vi.fn(),
    deleteSheet: vi.fn(),
    setSheetImage: vi.fn(),
    clearSheetImage: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

function sheet(name: string, type: SheetType): Sheet {
  return {
    id: name,
    name,
    imageUrl: null,
    imageFocusX: 50,
    imageFocusY: 50,
    imageScale: 1,
    type,
    class: 'Fighter',
    maxHp: 10,
    currentHp: 10,
    baseAc: 12,
    dexModifier: 2,
    initiativeBonus: 2,
    proficiencyBonus: 2,
    strength: 10,
    strengthMod: 0,
    dexterity: 14,
    dexterityMod: 2,
    constitution: 10,
    constitutionMod: 0,
    intelligence: 10,
    intelligenceMod: 0,
    wisdom: 10,
    wisdomMod: 0,
    charisma: 10,
    charismaMod: 0,
    features: [],
    attacks: [],
    spells: [],
    weapons: [],
    hasStoredImage: false,
    playerName: null,
  };
}

describe('SheetsPage filtro', () => {
  beforeEach(() => {
    listSheets.mockReset();
    listSheets.mockResolvedValue([sheet('Diana', 'Player'), sheet('Esqueleto', 'Creature')]);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('fichas_FiltroCategoria_EscondeOutrosTipos', async () => {
    render(<SheetsPage />);

    expect(await screen.findByText('Diana')).toBeTruthy();
    expect(screen.getByText('Esqueleto')).toBeTruthy();

    fireEvent.change(screen.getByLabelText(sheetFilterCategoryLabel), { target: { value: 'Creature' } });

    expect(screen.queryByText('Diana')).toBeNull();
    expect(screen.getByText('Esqueleto')).toBeTruthy();

    fireEvent.change(screen.getByLabelText(sheetFilterCategoryLabel), { target: { value: 'Npc' } });

    expect(screen.getByText(sheetFilterEmptyMessage)).toBeTruthy();
    expect(screen.queryByText('Esqueleto')).toBeNull();
  });
});
