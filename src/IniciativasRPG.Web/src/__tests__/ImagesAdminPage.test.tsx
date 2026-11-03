import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ImagesAdminPage } from '../pages/ImagesAdminPage';
import {
  imagesNavLabel,
  sceneDeleteLabel,
  sceneEditDialogLabel,
  sceneEditLabel,
  sceneEmptyMessage,
  sceneFilterKindLabel,
  sceneFilterNameLabel,
  sceneFilterExcludeTagsLabel,
  sceneFilterTagModeLabel,
  sceneFilterTagsLabel,
  sceneImageFileLabel,
  sceneImageSheetLabel,
  sceneImageUrlLabel,
  sceneIncludeLabel,
  sceneKindLabel,
  sceneNewLabel,
  sceneSaveLabel,
  sceneTitleRequired,
  sceneVisibilityToggleLabel,
} from '../config';
import type { CampaignScene } from '../types';

const {
  listScenes,
  listSceneTags,
  listSheets,
  createSceneTag,
  createScene,
  updateScene,
  deleteScene,
  setSceneVisibility,
} = vi.hoisted(() => ({
  listScenes: vi.fn(),
  listSceneTags: vi.fn(),
  listSheets: vi.fn(),
  createSceneTag: vi.fn(),
  createScene: vi.fn(),
  updateScene: vi.fn(),
  deleteScene: vi.fn(),
  setSceneVisibility: vi.fn(),
}));

vi.mock('../api', () => ({
  api: {
    listScenes,
    listSceneTags,
    listSheets,
    createSceneTag,
    createScene,
    updateScene,
    deleteScene,
    setSceneVisibility,
    fetchAuthorizedBlob: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

vi.mock('../components/SceneLightbox', () => ({
  SceneLightbox: () => null,
}));

function scene(partial: Partial<CampaignScene> & Pick<CampaignScene, 'id' | 'title'>): CampaignScene {
  return {
    imageUrl: 'https://example.com/scene.png',
    sortOrder: 0,
    isVisibleToPlayers: false,
    kind: 'Item',
    tags: [],
    ...partial,
  };
}

describe('ImagesAdminPage', () => {
  beforeEach(() => {
    listScenes.mockReset();
    listSceneTags.mockReset();
    listSceneTags.mockResolvedValue([]);
    listSheets.mockReset();
    listSheets.mockResolvedValue([]);
    createSceneTag.mockReset();
    createScene.mockReset();
    updateScene.mockReset();
    deleteScene.mockReset();
    setSceneVisibility.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('imagens_Lista_ChamaListScenes_IncluiOcultas', async () => {
    listScenes.mockResolvedValue([
      scene({ id: 's1', title: 'Espada', kind: 'Item', isVisibleToPlayers: false }),
    ]);

    render(<ImagesAdminPage />);

    expect(await screen.findByRole('heading', { name: imagesNavLabel })).toBeTruthy();
    const row = (await screen.findByText('Espada')).closest('li') as HTMLElement;
    expect(listScenes).toHaveBeenCalledTimes(1);
    expect(within(row).getByText('Item')).toBeTruthy();
    expect(row.querySelector('img')?.getAttribute('src')).toBe('https://example.com/scene.png');
    expect(within(row).getByRole('button', { name: sceneVisibilityToggleLabel }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('imagens_FiltroNomeETipo_EscondeItens', async () => {
    listScenes.mockResolvedValue([
      scene({ id: 's1', title: 'Floresta', kind: 'Map' }),
      scene({ id: 's2', title: 'Espada', kind: 'Item' }),
    ]);

    render(<ImagesAdminPage />);
    expect(await screen.findByText('Floresta')).toBeTruthy();

    fireEvent.change(screen.getByLabelText(sceneFilterNameLabel), { target: { value: 'esp' } });
    expect(screen.queryByText('Floresta')).toBeNull();
    expect(screen.getByText('Espada')).toBeTruthy();

    fireEvent.change(screen.getByLabelText(sceneFilterNameLabel), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(sceneFilterKindLabel), { target: { value: 'Map' } });
    expect(screen.getByText('Floresta')).toBeTruthy();
    expect(screen.queryByText('Espada')).toBeNull();
  });

  it('imagens_FiltroTags_AplicaAndOrENot', async () => {
    listSceneTags.mockResolvedValue([
      { id: 'hero', name: 'Herói' },
      { id: 'magic', name: 'Mágica' },
    ]);
    listScenes.mockResolvedValue([
      scene({ id: 'both', title: 'Espada heroica', tags: [{ id: 'hero', name: 'Herói' }, { id: 'magic', name: 'Mágica' }] }),
      scene({ id: 'hero', title: 'Guarda', tags: [{ id: 'hero', name: 'Herói' }] }),
      scene({ id: 'magic', title: 'Poção', tags: [{ id: 'magic', name: 'Mágica' }] }),
    ]);

    render(<ImagesAdminPage />);
    expect(await screen.findByText('Espada heroica')).toBeTruthy();

    const include = screen.getByLabelText(sceneFilterTagsLabel, {
      selector: 'select',
    }) as HTMLSelectElement;
    Array.from(include.options).forEach((option) => {
      option.selected = true;
    });
    fireEvent.change(include);
    expect(screen.getByText('Espada heroica')).toBeTruthy();
    expect(screen.queryByText('Guarda')).toBeNull();
    expect(screen.queryByText('Poção')).toBeNull();

    fireEvent.change(screen.getByLabelText(sceneFilterTagModeLabel), { target: { value: 'or' } });
    expect(screen.getByText('Guarda')).toBeTruthy();
    expect(screen.getByText('Poção')).toBeTruthy();

    const exclude = screen.getByLabelText(sceneFilterExcludeTagsLabel) as HTMLSelectElement;
    Array.from(exclude.options).find((option) => option.value === 'magic')!.selected = true;
    fireEvent.change(exclude);
    expect(screen.getByText('Guarda')).toBeTruthy();
    expect(screen.queryByText('Espada heroica')).toBeNull();
    expect(screen.queryByText('Poção')).toBeNull();
  });

  it('imagens_Toggle_ChamaSetSceneVisibility', async () => {
    listScenes.mockResolvedValue([scene({ id: 's1', title: 'Relíquia', isVisibleToPlayers: false })]);
    setSceneVisibility.mockResolvedValue([
      scene({ id: 's1', title: 'Relíquia', isVisibleToPlayers: true }),
    ]);

    render(<ImagesAdminPage />);
    const row = (await screen.findByText('Relíquia')).closest('li') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: sceneVisibilityToggleLabel }));

    await waitFor(() => {
      expect(setSceneVisibility).toHaveBeenCalledWith('s1', true);
    });
    expect(within(row).getByRole('button', { name: sceneVisibilityToggleLabel }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('imagens_Excluir_ChamaDeleteScene', async () => {
    listScenes.mockResolvedValue([scene({ id: 's1', title: 'Tocha' })]);
    deleteScene.mockResolvedValue([]);

    render(<ImagesAdminPage />);
    const row = (await screen.findByText('Tocha')).closest('li') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: sceneDeleteLabel }));

    await waitFor(() => {
      expect(deleteScene).toHaveBeenCalledWith('s1');
    });
    expect(await screen.findByText(sceneEmptyMessage)).toBeTruthy();
  });

  it('imagens_NovaImagem_AbreModalEInclui', async () => {
    listScenes.mockResolvedValue([]);
    listSceneTags.mockResolvedValue([{ id: 'weapon', name: 'Arma' }]);
    createScene.mockResolvedValue([scene({ id: 's1', title: 'Espada', kind: 'Item' })]);

    render(<ImagesAdminPage />);
    expect(await screen.findByText(sceneEmptyMessage)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: sceneNewLabel }));

    const dialog = screen.getByRole('dialog', { name: sceneNewLabel });
    fireEvent.submit(within(dialog).getByRole('button', { name: sceneIncludeLabel }).closest('form')!);
    expect(within(dialog).getByText(sceneTitleRequired)).toBeTruthy();
    expect(createScene).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText('Título'), { target: { value: 'Espada' } });
    fireEvent.change(within(dialog).getByLabelText(sceneKindLabel), { target: { value: 'Item' } });
    fireEvent.change(within(dialog).getByLabelText(sceneImageUrlLabel), {
      target: { value: 'https://example.com/sword.png' },
    });
    const tags = within(dialog).getByLabelText(sceneFilterTagsLabel, {
      selector: 'select',
    }) as HTMLSelectElement;
    tags.options[0].selected = true;
    fireEvent.change(tags);
    fireEvent.click(within(dialog).getByRole('button', { name: sceneIncludeLabel }));

    await waitFor(() => {
      expect(createScene).toHaveBeenCalledWith({
        title: 'Espada',
        kind: 'Item',
        imageUrl: 'https://example.com/sword.png',
        file: undefined,
        sheetId: undefined,
        tagIds: ['weapon'],
      });
    });
    expect(screen.queryByRole('dialog', { name: sceneNewLabel })).toBeNull();
  });

  it('imagens_Editar_SalvaSemTrocarArquivo', async () => {
    listScenes.mockResolvedValue([scene({ id: 's1', title: 'Floresta', kind: 'Map' })]);
    updateScene.mockResolvedValue([scene({ id: 's1', title: 'Floresta', kind: 'Map' })]);

    render(<ImagesAdminPage />);
    const row = (await screen.findByText('Floresta')).closest('li') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: sceneEditLabel }));

    const dialog = screen.getByRole('dialog', { name: sceneEditDialogLabel });
    expect((within(dialog).getByLabelText('Título') as HTMLInputElement).value).toBe('Floresta');
    expect((within(dialog).getByLabelText(sceneKindLabel) as HTMLSelectElement).value).toBe('Map');
    const link = within(dialog).getByLabelText(sceneImageUrlLabel) as HTMLInputElement;
    expect(link.value).toBe('');
    expect(link.placeholder).toBe('Deixe vazio para manter');

    fireEvent.click(within(dialog).getByRole('button', { name: sceneSaveLabel }));

    await waitFor(() => {
      expect(updateScene).toHaveBeenCalledWith('s1', {
        title: 'Floresta',
        kind: 'Map',
        imageUrl: undefined,
        file: undefined,
        sheetId: undefined,
        tagIds: [],
      });
    });
  });

  it('imagens_NovaImagemComFicha_EnviaSomenteSheetId', async () => {
    listScenes.mockResolvedValue([]);
    listSheets.mockResolvedValue([{ id: 'sheet-1', name: 'Lysander' }]);
    createScene.mockResolvedValue([
      scene({ id: 's1', title: 'Retrato de Lysander', sheetId: 'sheet-1' }),
    ]);

    render(<ImagesAdminPage />);
    await screen.findByText(sceneEmptyMessage);
    fireEvent.click(screen.getByRole('button', { name: sceneNewLabel }));

    const dialog = screen.getByRole('dialog', { name: sceneNewLabel });
    fireEvent.change(within(dialog).getByLabelText('Título'), {
      target: { value: 'Retrato de Lysander' },
    });
    fireEvent.change(within(dialog).getByLabelText(sceneKindLabel), { target: { value: 'Npc' } });
    expect(within(dialog).getByLabelText(sceneImageUrlLabel)).toBeTruthy();
    expect(within(dialog).getByLabelText(sceneImageFileLabel)).toBeTruthy();

    fireEvent.change(within(dialog).getByLabelText(sceneImageSheetLabel), {
      target: { value: 'sheet-1' },
    });
    expect(within(dialog).queryByLabelText(sceneImageUrlLabel)).toBeNull();
    expect(within(dialog).queryByLabelText(sceneImageFileLabel)).toBeNull();

    fireEvent.click(within(dialog).getByRole('button', { name: sceneIncludeLabel }));

    await waitFor(() => {
      expect(createScene).toHaveBeenCalledWith({
        title: 'Retrato de Lysander',
        kind: 'Npc',
        imageUrl: undefined,
        file: undefined,
        sheetId: 'sheet-1',
        tagIds: [],
      });
    });
  });

  it('imagens_SelecionarFicha_OcultaLinkEArquivoELimpaUrl', async () => {
    listScenes.mockResolvedValue([]);
    listSheets.mockResolvedValue([{ id: 'sheet-1', name: 'Lysander' }]);
    createScene.mockResolvedValue([scene({ id: 's1', title: 'Retrato', sheetId: 'sheet-1' })]);

    render(<ImagesAdminPage />);
    await screen.findByText(sceneEmptyMessage);
    fireEvent.click(screen.getByRole('button', { name: sceneNewLabel }));

    const dialog = screen.getByRole('dialog', { name: sceneNewLabel });
    fireEvent.change(within(dialog).getByLabelText('Título'), { target: { value: 'Retrato' } });
    fireEvent.change(within(dialog).getByLabelText(sceneKindLabel), { target: { value: 'Npc' } });
    fireEvent.change(within(dialog).getByLabelText(sceneImageUrlLabel), {
      target: { value: 'https://example.com/lysander.png' },
    });
    fireEvent.change(within(dialog).getByLabelText(sceneImageSheetLabel), {
      target: { value: 'sheet-1' },
    });

    expect(within(dialog).queryByLabelText(sceneImageUrlLabel)).toBeNull();
    expect(within(dialog).queryByLabelText(sceneImageFileLabel)).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: sceneIncludeLabel }));

    await waitFor(() => {
      expect(createScene).toHaveBeenCalledWith({
        title: 'Retrato',
        kind: 'Npc',
        imageUrl: undefined,
        file: undefined,
        sheetId: 'sheet-1',
        tagIds: [],
      });
    });
  });
});
