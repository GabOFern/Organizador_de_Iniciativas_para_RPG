import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { InvokeSceneModal } from '../components/InvokeSceneModal';
import { lineupConfirmLabel, lineupRemoveMemberLabel, resolveApiUrl } from '../config';
import type { Lineup } from '../types';

const listLineups = vi.fn();

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api');
  return {
    ...actual,
    api: {
      ...actual.api,
      listLineups: () => listLineups(),
    },
  };
});

const cemetery: Lineup = {
  id: 'l1',
  name: 'Cemitério',
  members: [
    {
      sheetId: 's1',
      sheetName: 'Diana',
      sheetType: 'Player',
      initiativeBonus: 2,
      quantity: 1,
      sortOrder: 0,
      imageUrl: '/diana.png',
    },
    {
      sheetId: 's2',
      sheetName: 'Sino',
      sheetType: 'Creature',
      initiativeBonus: 0,
      quantity: 1,
      sortOrder: 1,
      imageUrl: null,
    },
  ],
};

describe('InvokeSceneModal', () => {
  beforeEach(() => {
    listLineups.mockReset();
    listLineups.mockResolvedValue([cemetery]);
  });

  afterEach(() => {
    cleanup();
  });

  it('invocarCena_RemoveDaFila_ENaoEnviaAFicha', async () => {
    const onInvoke = vi.fn().mockResolvedValue(undefined);
    render(<InvokeSceneModal open onClose={() => {}} onInvoke={onInvoke} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Cemitério' }));

    const removeDiana = await screen.findByRole('button', { name: lineupRemoveMemberLabel('Diana') });
    const row = removeDiana.closest('.lineup-invoke-row');
    expect(row?.querySelector('img')?.getAttribute('src')).toBe(resolveApiUrl('/diana.png'));
    expect(row?.querySelector('.lineup-invoke-thumb')).toBeTruthy();
    expect(row?.querySelector('.lineup-sheet-name')?.textContent).toBe('Diana');
    expect(row?.querySelector('.lineup-invoke-actions')?.textContent).toContain('Iniciativa');
    expect(row?.querySelector('.lineup-invoke-actions')?.textContent).toContain('Rolar');

    fireEvent.click(removeDiana);
    expect(screen.queryByRole('button', { name: lineupRemoveMemberLabel('Diana') })).toBeNull();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: lineupConfirmLabel }));

    expect(onInvoke).toHaveBeenCalledWith({
      lineupId: 'l1',
      members: [{ sheetId: 's2', initiative: 9, rollDice: false }],
    });
  });
});
