import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth';
import { publicBattleHubFallbackMs } from '../config';
import { PublicBattlePage } from '../pages/PublicBattlePage';
import { ThemeProvider } from '../theme';
import type { BattleSnapshot, CampaignScene, Combatant } from '../types';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

const getPublicBattle = vi.fn();
const listPublicScenes = vi.fn();

const handlers = vi.hoisted(() => ({
  onUpdate: null as ((snapshot: BattleSnapshot) => void) | null,
  onScenes: null as ((scenes: CampaignScene[]) => void) | null,
  onFailed: null as (() => void) | null,
}));

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api');
  return {
    ...actual,
    api: {
      ...actual.api,
      getPublicBattle: (...args: unknown[]) => getPublicBattle(...args),
      listPublicScenes: (...args: unknown[]) => listPublicScenes(...args),
    },
  };
});

vi.mock('../hooks/useBattleHub', () => ({
  useBattleHub: (
    _token: string | null | undefined,
    onUpdate: (snapshot: BattleSnapshot) => void,
    _access?: string | null,
    onScenes?: (scenes: CampaignScene[]) => void,
    onFailed?: () => void,
  ) => {
    handlers.onUpdate = onUpdate;
    handlers.onScenes = onScenes ?? null;
    handlers.onFailed = onFailed ?? null;
  },
}));

function combatant(): Combatant {
  return {
    id: 'c1',
    sheetId: 's1',
    name: 'Goblin',
    imageUrl: null,
    imageFocusX: 50,
    imageFocusY: 50,
    imageScale: 1,
    sheetType: 'Creature',
    initiative: 15,
    currentHp: 9,
    maxHp: 12,
    currentAc: 13,
    isDead: false,
    sortOrder: 0,
    isCurrentTurn: true,
    hideHpFromPublic: false,
    modifiers: [],
  };
}

function snapshot(): BattleSnapshot {
  return {
    id: 'b1',
    publicToken: 'tok-publico',
    status: 'Active',
    currentTurnIndex: 0,
    combatants: [combatant()],
    message: null,
    lastDiceRoll: null,
    isTestBattle: false,
  };
}

function scene(): CampaignScene {
  return {
    id: 's1',
    title: 'Castelo',
    imageUrl: 'https://example.com/castelo.png',
    sortOrder: 0,
    isVisibleToPlayers: true,
    kind: 'Map',
  };
}

function renderPage() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/publico/tok-publico']}>
          <Routes>
            <Route path="/publico/:token" element={<PublicBattlePage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>,
  );
}

describe('PublicBattlePage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    localStorage.clear();
    getPublicBattle.mockReset();
    listPublicScenes.mockReset();
    getPublicBattle.mockResolvedValue(snapshot());
    listPublicScenes.mockResolvedValue([scene()]);
    handlers.onUpdate = null;
    handlers.onScenes = null;
    handlers.onFailed = null;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('hubEntregaSnapshotECenas_NaoChamaRest', async () => {
    renderPage();
    expect(getPublicBattle).not.toHaveBeenCalled();
    expect(listPublicScenes).not.toHaveBeenCalled();

    await act(async () => {
      handlers.onUpdate?.(snapshot());
      handlers.onScenes?.([scene()]);
    });

    expect(screen.getByRole('heading', { name: 'Goblin' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Imagens, 1 nova/ })).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(publicBattleHubFallbackMs);
    });

    expect(getPublicBattle).not.toHaveBeenCalled();
    expect(listPublicScenes).not.toHaveBeenCalled();
  });

  it('timeoutSemSnapshot_ChamaRest', async () => {
    renderPage();

    await act(async () => {
      vi.advanceTimersByTime(publicBattleHubFallbackMs);
    });

    expect(getPublicBattle).toHaveBeenCalledWith('tok-publico');
    expect(listPublicScenes).toHaveBeenCalledWith('tok-publico');
  });

  it('hubFalhou_ChamaRestNaHora', async () => {
    renderPage();

    await act(async () => {
      handlers.onFailed?.();
    });

    expect(getPublicBattle).toHaveBeenCalledWith('tok-publico');
    expect(listPublicScenes).toHaveBeenCalledWith('tok-publico');
    expect(vi.getTimerCount()).toBe(0);
  });
});
