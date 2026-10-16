import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ScenePanel } from '../components/ScenePanel';
import {
  sceneCancelEditLabel,
  sceneEditDialogLabel,
  sceneEditLabel,
  sceneEmptyMessage,
  sceneFilterNameLabel,
  sceneIncludeLabel,
  sceneKindLabel,
  sceneLauncherLabel,
  sceneNewLabel,
  sceneSaveLabel,
  sceneTitleRequired,
  sceneVisibilityShowLabel,
} from '../config';
import type { CampaignScene } from '../types';

const listScenes = vi.fn();
const listPublicScenes = vi.fn();
const setSceneVisibility = vi.fn();
const createScene = vi.fn();
const updateScene = vi.fn();
const deleteScene = vi.fn();

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api');
  return {
    ...actual,
    api: {
      ...actual.api,
      listScenes: (...args: unknown[]) => listScenes(...args),
      listPublicScenes: (...args: unknown[]) => listPublicScenes(...args),
      setSceneVisibility: (...args: unknown[]) => setSceneVisibility(...args),
      createScene: (...args: unknown[]) => createScene(...args),
      updateScene: (...args: unknown[]) => updateScene(...args),
      deleteScene: (...args: unknown[]) => deleteScene(...args),
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
        start: vi.fn().mockResolvedValue(undefined),
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
    setSceneVisibility.mockReset();
    createScene.mockReset();
    updateScene.mockReset();
    deleteScene.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('mestre_CliqueOlho_ChamaSetSceneVisibility_EEditarAntesDeRemover', async () => {
    const hidden = scene({ id: 's1', title: 'Floresta', isVisibleToPlayers: false, kind: 'Map' });
    listScenes.mockResolvedValue([hidden]);
    setSceneVisibility.mockResolvedValue([
      scene({ id: 's1', title: 'Floresta', isVisibleToPlayers: true, kind: 'Map' }),
    ]);

    render(<ScenePanel publicToken="tok" canEdit />);

    fireEvent.click(screen.getByRole('button', { name: sceneLauncherLabel }));

    await waitFor(() => {
      expect(screen.getByText('Floresta')).toBeTruthy();
    });

    const row = screen.getByText('Floresta').closest('li');
    expect(row?.className).toContain('scene-row-master');
    const actions = row?.querySelector('.scene-row-actions') as HTMLElement;
    expect(actions).toBeTruthy();
    const actionButtons = within(actions).getAllByRole('button');
    const labels = actionButtons.map((btn) => btn.getAttribute('aria-label') || btn.textContent);
    const editIndex = labels.findIndex((label) => label === sceneEditLabel);
    const removeIndex = labels.findIndex((label) => label === 'Remover');
    expect(editIndex).toBeGreaterThanOrEqual(0);
    expect(removeIndex).toBeGreaterThan(editIndex);

    fireEvent.click(screen.getByRole('button', { name: sceneVisibilityShowLabel }));

    await waitFor(() => {
      expect(setSceneVisibility).toHaveBeenCalledWith('s1', true);
    });
  });

  it('mestre_NovaImagem_NoTopo_AbreModalVazio_EInclui', async () => {
    listScenes.mockResolvedValue([]);
    createScene.mockResolvedValue([
      scene({ id: 's1', title: 'Espada', kind: 'Item' }),
    ]);

    render(<ScenePanel publicToken="tok" canEdit />);
    fireEvent.click(screen.getByRole('button', { name: sceneLauncherLabel }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: sceneNewLabel })).toBeTruthy();
    });

    const nova = screen.getByRole('button', { name: sceneNewLabel });
    const empty = screen.getByText(sceneEmptyMessage);
    expect(nova.compareDocumentPosition(empty) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByLabelText('Título')).toBeNull();

    fireEvent.click(nova);

    const dialog = screen.getByRole('dialog', { name: sceneNewLabel });
    expect(dialog.parentElement?.className).toContain('scene-editor-backdrop');
    expect((within(dialog).getByLabelText('Título') as HTMLInputElement).value).toBe('');
    expect((within(dialog).getByLabelText(sceneKindLabel) as HTMLSelectElement).value).toBe('');
    expect((within(dialog).getByLabelText('Link da imagem') as HTMLInputElement).value).toBe('');

    fireEvent.submit(within(dialog).getByRole('button', { name: sceneIncludeLabel }).closest('form')!);
    expect(within(dialog).getByText(sceneTitleRequired)).toBeTruthy();
    expect(createScene).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText('Título'), { target: { value: 'Espada' } });
    fireEvent.change(within(dialog).getByLabelText(sceneKindLabel), { target: { value: 'Item' } });
    fireEvent.change(within(dialog).getByLabelText('Link da imagem'), {
      target: { value: 'https://example.com/sword.png' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: sceneIncludeLabel }));

    await waitFor(() => {
      expect(createScene).toHaveBeenCalledWith({
        title: 'Espada',
        kind: 'Item',
        imageUrl: 'https://example.com/sword.png',
        file: undefined,
      });
    });
    expect(screen.queryByRole('dialog', { name: sceneNewLabel })).toBeNull();
  });

  it('mestre_Editar_AbreModalPreenchido_ESalva', async () => {
    listScenes.mockResolvedValue([
      scene({ id: 's1', title: 'Floresta', kind: 'Map' }),
      scene({ id: 's2', title: 'Relíquia', kind: 'Uncategorized' }),
    ]);
    updateScene.mockResolvedValue([
      scene({ id: 's1', title: 'Floresta', kind: 'Map' }),
    ]);

    render(<ScenePanel publicToken="tok" canEdit />);
    fireEvent.click(screen.getByRole('button', { name: sceneLauncherLabel }));

    await waitFor(() => {
      expect(screen.getByText('Floresta')).toBeTruthy();
    });

    const nova = screen.getByRole('button', { name: sceneNewLabel });
    expect(
      nova.compareDocumentPosition(screen.getByText('Floresta')) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const relicRow = screen.getByText('Relíquia').closest('li') as HTMLElement;
    fireEvent.click(within(relicRow).getByRole('button', { name: sceneEditLabel }));
    const relicDialog = screen.getByRole('dialog', { name: sceneEditDialogLabel });
    expect((within(relicDialog).getByLabelText(sceneKindLabel) as HTMLSelectElement).value).toBe('');
    fireEvent.click(within(relicDialog).getByRole('button', { name: sceneCancelEditLabel }));
    expect(updateScene).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: sceneEditDialogLabel })).toBeNull();

    const row = screen.getByText('Floresta').closest('li') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: sceneEditLabel }));

    const dialog = screen.getByRole('dialog', { name: sceneEditDialogLabel });
    expect((within(dialog).getByLabelText('Título') as HTMLInputElement).value).toBe('Floresta');
    expect((within(dialog).getByLabelText(sceneKindLabel) as HTMLSelectElement).value).toBe('Map');
    const link = within(dialog).getByLabelText('Link da imagem') as HTMLInputElement;
    expect(link.value).toBe('');
    expect(link.placeholder).toBe('Deixe vazio para manter');

    fireEvent.click(within(dialog).getByRole('button', { name: sceneSaveLabel }));

    await waitFor(() => {
      expect(updateScene).toHaveBeenCalledWith('s1', {
        title: 'Floresta',
        kind: 'Map',
        imageUrl: undefined,
        file: undefined,
      });
    });
  });

  it('mestre_Escape_FechaModalAntesDaAba', async () => {
    listScenes.mockResolvedValue([]);

    render(<ScenePanel publicToken="tok" canEdit />);
    fireEvent.click(screen.getByRole('button', { name: sceneLauncherLabel }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: sceneNewLabel })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: sceneNewLabel }));
    expect(screen.getByRole('dialog', { name: sceneNewLabel })).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: sceneNewLabel })).toBeNull();
    expect(screen.getByRole('dialog', { name: sceneLauncherLabel })).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: sceneLauncherLabel })).toBeNull();
  });

  it('mestre_FiltroPorNome_EscondeItem', async () => {
    listScenes.mockResolvedValue([
      scene({ id: 's1', title: 'Floresta', kind: 'Map' }),
      scene({ id: 's2', title: 'Espada', kind: 'Item' }),
    ]);

    render(<ScenePanel publicToken="tok" canEdit />);
    fireEvent.click(screen.getByRole('button', { name: sceneLauncherLabel }));

    await waitFor(() => {
      expect(screen.getByText('Floresta')).toBeTruthy();
      expect(screen.getByText('Espada')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText(sceneFilterNameLabel), {
      target: { value: 'esp' },
    });

    expect(screen.queryByText('Floresta')).toBeNull();
    expect(screen.getByText('Espada')).toBeTruthy();
  });

  it('jogador_BadgeEBorda_SomemAoAbrirImagem', async () => {
    listPublicScenes.mockResolvedValue([
      scene({ id: 's1', title: 'Castelo', isVisibleToPlayers: true, kind: 'Map' }),
    ]);

    render(<ScenePanel publicToken="tok-player" canEdit={false} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Imagens, 1 nova/ })).toBeTruthy();
    });
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
});
