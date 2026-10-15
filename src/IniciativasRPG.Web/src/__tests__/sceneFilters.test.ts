import { describe, it, expect } from 'vitest';
import { filterScenes } from '../sceneFilters';
import type { CampaignScene } from '../types';

function scene(
  partial: Partial<CampaignScene> & Pick<CampaignScene, 'id' | 'title' | 'kind'>,
): CampaignScene {
  return {
    imageUrl: '/x',
    sortOrder: 0,
    isVisibleToPlayers: false,
    ...partial,
  };
}

const sample: CampaignScene[] = [
  scene({ id: '1', title: 'Espada Longa', kind: 'Item' }),
  scene({ id: '2', title: 'Guarda Real', kind: 'Npc' }),
  scene({ id: '3', title: 'Carta do Destino', kind: 'Card' }),
  scene({ id: '4', title: 'Castelo Antigo', kind: 'Map' }),
  scene({ id: '5', title: 'Sem categoria', kind: 'Uncategorized' }),
];

describe('filterScenes', () => {
  it('filtraPorNome_CaseInsensitive', () => {
    const result = filterScenes(sample, { nameQuery: 'carta', kind: 'all' });
    expect(result.map((s) => s.id)).toEqual(['3']);
  });

  it('filtraPorKind', () => {
    const result = filterScenes(sample, { nameQuery: '', kind: 'Item' });
    expect(result.map((s) => s.id)).toEqual(['1']);
  });

  it('filtroTodos_RetornaTudo', () => {
    expect(filterScenes(sample, { nameQuery: '', kind: 'all' })).toHaveLength(5);
  });

  it('filtroSemTipo_RetornaUncategorized', () => {
    const result = filterScenes(sample, { nameQuery: '', kind: 'Uncategorized' });
    expect(result.map((s) => s.id)).toEqual(['5']);
  });

  it('combinaNomeEKind', () => {
    const result = filterScenes(sample, { nameQuery: 'guarda', kind: 'Npc' });
    expect(result.map((s) => s.id)).toEqual(['2']);
    expect(filterScenes(sample, { nameQuery: 'guarda', kind: 'Item' })).toEqual([]);
  });
});
