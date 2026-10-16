import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SheetsPage } from '../pages/SheetsPage';
import { sheetPlayerNameLabel } from '../config';

vi.mock('../api', () => ({
  api: {
    listSheets: vi.fn().mockResolvedValue([]),
    createSheet: vi.fn(),
    updateSheet: vi.fn(),
    deleteSheet: vi.fn(),
    setSheetImage: vi.fn(),
    clearSheetImage: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

describe('SheetsPage nome do jogador', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('mostra o campo opcional na ficha de player e esconde nas outras', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );

    render(<SheetsPage />);

    const field = await screen.findByLabelText(sheetPlayerNameLabel);
    expect(field.getAttribute('required')).toBeNull();

    fireEvent.change(screen.getAllByLabelText('Tipo')[0], { target: { value: 'Creature' } });

    expect(screen.queryByLabelText(sheetPlayerNameLabel)).toBeNull();
  });
});
