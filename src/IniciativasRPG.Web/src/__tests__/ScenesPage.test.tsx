import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ScenesPage } from '../pages/ScenesPage';
import {
  lineupDeleteLabel,
  lineupEditLabel,
  lineupIncludeLabel,
  lineupNameLabel,
  lineupQuantityFieldLabel,
  lineupQuantityIncreaseLabel,
  lineupSaveLabel,
  resolveApiUrl,
  sheetFilterCategoryLabel,
  sheetFilterNameLabel,
} from '../config';
import type { Lineup, Sheet, SheetType } from '../types';

const listLineups = vi.fn();
const listSheets = vi.fn();
const createLineup = vi.fn();
const updateLineup = vi.fn();
const deleteLineup = vi.fn();

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api');
  return {
    ...actual,
    api: {
      ...actual.api,
      listLineups: () => listLineups(),
      listSheets: () => listSheets(),
      createLineup: (body: unknown) => createLineup(body),
      updateLineup: (id: string, body: unknown) => updateLineup(id, body),
      deleteLineup: (id: string) => deleteLineup(id),
    },
  };
});

function sheet(id: string, name: string, type: SheetType = 'Player'): Sheet {
  return {
    id,
    name,
    type,
    imageUrl: null,
    imageFocusX: 50,
    imageFocusY: 50,
    imageScale: 1,
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

describe('ScenesPage', () => {
  beforeEach(() => {
    listLineups.mockReset();
    listSheets.mockReset();
    createLineup.mockReset();
    updateLineup.mockReset();
    deleteLineup.mockReset();
    listSheets.mockResolvedValue([sheet('s1', 'Diana'), sheet('s2', 'Howl')]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
  });

  it('cenas_CriarEditarExcluir_ChamaAApi', async () => {
    const created: Lineup = {
      id: 'l1',
      name: 'Jogadores',
      members: [
        { sheetId: 's1', sheetName: 'Diana', sheetType: 'Player', initiativeBonus: 2, quantity: 1, sortOrder: 0 },
        { sheetId: 's2', sheetName: 'Howl', sheetType: 'Player', initiativeBonus: 2, quantity: 1, sortOrder: 1 },
      ],
    };
    listLineups.mockResolvedValueOnce([]).mockResolvedValueOnce([created]).mockResolvedValue([
      { ...created, name: 'Mesa' },
    ]);
    createLineup.mockResolvedValue(created);
    updateLineup.mockResolvedValue({ ...created, name: 'Mesa' });
    deleteLineup.mockResolvedValue(undefined);

    render(<ScenesPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(lineupNameLabel)).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText(lineupNameLabel), { target: { value: 'Jogadores' } });
    fireEvent.click(screen.getByRole('button', { name: lineupQuantityIncreaseLabel('Diana') }));
    fireEvent.click(screen.getByRole('button', { name: lineupQuantityIncreaseLabel('Howl') }));
    fireEvent.click(screen.getByRole('button', { name: lineupIncludeLabel }));

    await waitFor(() => {
      expect(createLineup).toHaveBeenCalledWith({
        name: 'Jogadores',
        members: [
          { sheetId: 's1', quantity: 1 },
          { sheetId: 's2', quantity: 1 },
        ],
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Jogadores')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: lineupEditLabel }));
    fireEvent.change(screen.getByLabelText(lineupNameLabel), { target: { value: 'Mesa' } });
    fireEvent.click(screen.getByRole('button', { name: lineupSaveLabel }));

    await waitFor(() => {
      expect(updateLineup).toHaveBeenCalledWith('l1', {
        name: 'Mesa',
        members: [
          { sheetId: 's1', quantity: 1 },
          { sheetId: 's2', quantity: 1 },
        ],
      });
    });

    fireEvent.click(screen.getByRole('button', { name: lineupDeleteLabel }));

    await waitFor(() => {
      expect(deleteLineup).toHaveBeenCalledWith('l1');
    });
  });

  it('cenas_Ficha_MiniaturaNomeEQuantidadeNaMesmaLinha', async () => {
    listLineups.mockResolvedValue([]);
    listSheets.mockResolvedValue([{ ...sheet('s1', 'Diana', 'Player'), imageUrl: '/sino.png' }]);

    render(<ScenesPage />);

    const field = await screen.findByRole('spinbutton', { name: lineupQuantityFieldLabel('Diana') });
    const row = field.closest('.lineup-sheet-option');

    expect(row?.querySelector('img')?.getAttribute('src')).toBe(resolveApiUrl('/sino.png'));
    expect(row?.querySelector('.lineup-sheet-name')?.textContent).toBe('Diana - Jogador');
    expect(row?.querySelector('.lineup-qty')?.contains(field)).toBe(true);
  });

  it('cenas_Quantidade_GravaCopiasEMantemOculta', async () => {
    listLineups.mockResolvedValue([]);
    listSheets.mockResolvedValue([
      sheet('s1', 'Diana', 'Player'),
      sheet('s2', 'Esqueleto', 'Creature'),
    ]);
    createLineup.mockResolvedValue({ id: 'l1', name: 'Mesa', members: [] });

    render(<ScenesPage />);

    const diana = await screen.findByRole('button', { name: lineupQuantityIncreaseLabel('Diana') });
    fireEvent.click(diana);
    fireEvent.click(diana);
    fireEvent.change(screen.getByLabelText(sheetFilterNameLabel), { target: { value: 'esque' } });
    fireEvent.change(screen.getByLabelText(sheetFilterCategoryLabel), { target: { value: 'Creature' } });

    expect(screen.queryByRole('spinbutton', { name: lineupQuantityFieldLabel('Diana') })).toBeNull();

    const skeleton = screen.getByRole('button', { name: lineupQuantityIncreaseLabel('Esqueleto') });
    fireEvent.click(skeleton);
    fireEvent.click(skeleton);
    fireEvent.change(screen.getByLabelText(lineupNameLabel), { target: { value: 'Mesa' } });
    fireEvent.click(screen.getByRole('button', { name: lineupIncludeLabel }));

    await waitFor(() => {
      expect(createLineup).toHaveBeenCalledWith({
        name: 'Mesa',
        members: [
          { sheetId: 's1', quantity: 1 },
          { sheetId: 's2', quantity: 2 },
        ],
      });
    });
  });
});
