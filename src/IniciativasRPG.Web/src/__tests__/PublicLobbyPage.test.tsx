import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { config } from '../config';
import { PublicLobbyPage } from '../pages/PublicLobbyPage';
import { ThemeProvider } from '../theme';

const listPublicBattles = vi.fn();

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api');
  return {
    ...actual,
    api: {
      ...actual.api,
      listPublicBattles: (...args: unknown[]) => listPublicBattles(...args),
    },
  };
});

function renderLobby() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <PublicLobbyPage />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('PublicLobbyPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    listPublicBattles.mockReset();
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it('tema de classe mostra CardFrame no card da batalha', async () => {
    sessionStorage.setItem(config.themeSessionKey, 'Fighter');
    listPublicBattles.mockResolvedValue([
      {
        publicToken: 'tok',
        status: 'Active',
        combatantCount: 2,
        combatantNames: ['A', 'B'],
        createdAtUtc: '2026-01-01T15:00:00Z',
      },
    ]);

    const { container } = renderLobby();

    await waitFor(() => {
      expect(screen.getByText('Entrar')).toBeTruthy();
    });
    expect(container.querySelector('.battle-lobby-card .card-frame')).toBeTruthy();
  });
});
