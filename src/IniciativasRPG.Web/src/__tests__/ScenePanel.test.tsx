import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ScenePanel } from '../components/ScenePanel';
import {
  sceneEditLabel,
  sceneEmptyMessage,
  sceneFilterNameLabel,
  sceneLauncherLabel,
  sceneNewLabel,
  sceneVisibilityHideLabel,
  sceneVisibilityShowLabel,
} from '../config';
import type { CampaignScene } from '../types';

const listScenes = vi.fn();
const listPublicScenes = vi.fn();
const hubStart = vi.fn().mockResolvedValue(undefined);

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api');
  return {
    ...actual,
    api: {
      ...actual.api,
      listScenes: (...args: unknown[]) => listScenes(...args),
      listPublicScenes: (...args: unknown[]) => listPublicScenes(...args),
      fetchAuthorizedBlob: vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' })),
    },
  };
});

vi.mock('../auth', () => ({
  useAuth: () => ({
    token: 'master-token',
    isAuthenticated: true,
    campaignId: 'c1',
    campaignName: 'Camp',
    campaignPublicToken: 'tok',
    loginCampaign: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: class {
    withUrl() {
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    build() {
      return {
        on: vi.fn(),
        off: vi.fn(),
        start: () => hubStart(),
        stop: vi.fn().mockResolvedValue(undefined),
        invoke: vi.fn().mockResolvedValue(undefined),
      };
    }
  },
}));

vi.mock('../components/SceneLightbox', () => ({
  SceneLightbox: ({ scene, onClose }: { scene: CampaignScene; onClose: () => void }) => (
    <div role="dialog" aria-label={`lightbox-${scene.title}`}>
      <button type="button" onClick={onClose}>
        Fechar lightbox
      </button>
    </div>
  ),
}));

function scene(partial: Partial<CampaignScene> & Pick<CampaignScene, 'id' | 'title'>): CampaignScene {
  return {
    imageUrl: '/api/scenes/x/image',
    sortOrder: 0,
    isVisibleToPlayers: false,
    kind: 'Item',
    ...partial,
  };
}

describe('ScenePanel', () => {
  beforeEach(() => {
    listScenes.mockReset();
    listPublicScenes.mockReset();
    hubStart.mockReset();
    hubStart.mockResolvedValue(undefined);
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('mestre_Drawer_SemCrud_ListaSomenteVisiveis', async () => {
    listScenes.mockResolvedValue([
      scene({ id: 's1', title: 'Floresta', isVisibleToPlayers: true, kind: 'Map' }),
      scene({ id: 's2', title: 'Segredo', isVisibleToPlayers: false, kind: 'Item' }),
    ]);

    render(<ScenePanel publicToken="tok" canEdit />);
    fireEvent.click(screen.getByRole('button', { name: sceneLauncherLabel }));

    await waitFor(() => {
      expect(listScenes).toHaveBeenCalled();
      expect(screen.getByText('Floresta')).toBeTruthy();
    });

    expect(listPublicScenes).not.toHaveBeenCalled();
    expect(screen.queryByText('Segredo')).toBeNull();
    expect(screen.queryByText('Mapa/Construção')).toBeNull();
    expect(screen.queryByRole('button', { name: sceneNewLabel })).toBeNull();
    expect(screen.queryByRole('button', { name: sceneEditLabel })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remover' })).toBeNull();
    expect(screen.queryByRole('button', { name: sceneVisibilityShowLabel })).toBeNull();
    expect(screen.queryByRole('button', { name: sceneVisibilityHideLabel })).toBeNull();
    expect(screen.queryByLabelText(sceneFilterNameLabel)).toBeNull();
    expect(screen.queryByLabelText('Título')).toBeNull();
    expect(document.querySelector('.scene-row-actions')).toBeNull();

    const row = screen.getByText('Floresta').closest('li');
    expect(row?.className).not.toContain('scene-row-master');

    fireEvent.click(screen.getByText('Floresta'));

    await waitFor(() => {
      expect(screen.getByLabelText('lightbox-Floresta')).toBeTruthy();
    });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByLabelText('lightbox-Floresta')).toBeNull();
    expect(screen.getByRole('dialog', { name: sceneLauncherLabel })).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: sceneLauncherLabel })).toBeNull();
  });

  it('mestre_ApenasOcultas_MostraMensagemVazia', async () => {
    const loaded = Promise.resolve([
      scene({ id: 's1', title: 'Segredo', isVisibleToPlayers: false, kind: 'Item' }),
    ]);
    listScenes.mockReturnValue(loaded);

    render(<ScenePanel publicToken="tok" canEdit />);
    await act(async () => {
      await loaded;
    });
    fireEvent.click(screen.getByRole('button', { name: sceneLauncherLabel }));

    expect(listScenes).toHaveBeenCalled();
    expect(screen.getByText(sceneEmptyMessage)).toBeTruthy();

    expect(screen.queryByText('Segredo')).toBeNull();
    expect(screen.queryByRole('button', { name: sceneNewLabel })).toBeNull();
  });

  it('jogador_BadgeEBorda_SomemAoAbrirImagem', async () => {
    listPublicScenes.mockResolvedValue([
      scene({ id: 's1', title: 'Castelo', isVisibleToPlayers: true, kind: 'Map' }),
    ]);

    render(<ScenePanel publicToken="tok-player" canEdit={false} />);

    await waitFor(() => {
      expect(listPublicScenes).toHaveBeenCalledWith('tok-player');
      expect(screen.getByRole('button', { name: /Imagens, 1 nova/ })).toBeTruthy();
    });
    expect(hubStart).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Imagens, 1 nova/ }).textContent).toContain('(1)');

    fireEvent.click(screen.getByRole('button', { name: /Imagens, 1 nova/ }));

    await waitFor(() => {
      expect(screen.getByText('Castelo')).toBeTruthy();
    });

    expect(screen.queryByLabelText(sceneFilterNameLabel)).toBeNull();
    expect(screen.queryByText(sceneEditLabel)).toBeNull();
    expect(screen.queryByRole('button', { name: sceneNewLabel })).toBeNull();

    const row = screen.getByText('Castelo').closest('li');
    expect(row?.className).toContain('scene-row-unread');

    fireEvent.click(screen.getByText('Castelo'));

    await waitFor(() => {
      expect(screen.getByLabelText('lightbox-Castelo')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Fechar lightbox'));

    await waitFor(() => {
      expect(screen.queryByLabelText('lightbox-Castelo')).toBeNull();
    });

    const rowAfter = screen.getByText('Castelo').closest('li');
    expect(rowAfter?.className).not.toContain('scene-row-unread');

    const drawer = screen.getByRole('dialog', { name: sceneLauncherLabel });
    fireEvent.click(within(drawer).getByRole('button', { name: 'Fechar' }));

    await waitFor(() => {
      const launcher = screen.getByRole('button', { name: sceneLauncherLabel });
      expect(launcher.textContent).toBe(sceneLauncherLabel);
      expect(launcher.textContent).not.toContain('(1)');
    });
  });

  it('jogador_CenasControladas_NaoChamaListPublicScenes', async () => {
    const controlled = [
      scene({ id: 's1', title: 'Castelo', isVisibleToPlayers: true, kind: 'Map' }),
    ];

    const view = render(
      <ScenePanel publicToken="tok-player" canEdit={false} scenes={controlled} />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Imagens, 1 nova/ })).toBeTruthy();
    });
    expect(listPublicScenes).not.toHaveBeenCalled();
    expect(listScenes).not.toHaveBeenCalled();
    expect(hubStart).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Imagens, 1 nova/ }));
    expect(screen.getByText('Castelo')).toBeTruthy();
    expect(listPublicScenes).not.toHaveBeenCalled();

    view.rerender(
      <ScenePanel
        publicToken="tok-player"
        canEdit={false}
        scenes={[
          ...controlled,
          scene({ id: 's2', title: 'Porta', isVisibleToPlayers: true, kind: 'Item' }),
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Porta')).toBeTruthy();
    });
    expect(listPublicScenes).not.toHaveBeenCalled();
    expect(hubStart).not.toHaveBeenCalled();
  });
});
