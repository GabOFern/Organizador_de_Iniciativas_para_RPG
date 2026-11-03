import { describe, expect, it } from 'vitest';
import {
  filterGalleryItems,
  type GalleryFilterItem,
  type GalleryFilterOptions,
} from '../galleryFilters';
function item(
  partial: Partial<GalleryFilterItem> & Pick<GalleryFilterItem, 'title'>,
): GalleryFilterItem {
  return {
    kind: 'Item',
    tags: [],
    ...partial,
  };
}

function tag(id: string): { id: string } {
  return { id };
}

const tagHero = 'tag-hero';
const tagMagic = 'tag-magic';
const tagHidden = 'tag-hidden';
const tagMap = 'tag-map';

const sample: GalleryFilterItem[] = [
  item({ title: 'Espada Longa', kind: 'Item', tags: [tag(tagHero), tag(tagMagic)] }),
  item({ title: 'Guarda Real', kind: 'Npc', tags: [tag(tagHero)] }),
  item({ title: 'Carta do Destino', kind: 'Card', tags: [tag(tagMagic)] }),
  item({ title: 'Castelo Antigo', kind: 'Map', tags: [tag(tagMap)] }),
  item({ title: 'Sem categoria', kind: 'Uncategorized', tags: [] }),
  item({ title: 'Retrato Oculto', kind: 'Npc', tags: [tag(tagHero), tag(tagHidden)] }),
];

function filter(overrides: Partial<GalleryFilterOptions> = {}): GalleryFilterItem[] {
  return filterGalleryItems(sample, {
    nameQuery: '',
    category: 'all',
    tagMode: 'and',
    includeTagIds: [],
    excludeTagIds: [],
    ...overrides,
  });
}

function titles(items: GalleryFilterItem[]): string[] {
  return items.map((entry) => entry.title);
}

describe('filterGalleryItems', () => {
  it('filterGalleryItems_Nome_ContemIgnorandoMaiusculas', () => {
    expect(titles(filter({ nameQuery: 'CARTA' }))).toEqual(['Carta do Destino']);
  });

  it('filterGalleryItems_NomeComEspacos_TrimAntesDeFiltrar', () => {
    expect(titles(filter({ nameQuery: '  espada  ' }))).toEqual(['Espada Longa']);
  });

  it('filterGalleryItems_NomeVazio_NaoRestringe', () => {
    expect(filter({ nameQuery: '   ' })).toHaveLength(sample.length);
  });

  it('filterGalleryItems_Categoria_IgualdadeMantemSoOTipo', () => {
    expect(titles(filter({ category: 'Map' }))).toEqual(['Castelo Antigo']);
  });

  it('filterGalleryItems_CategoriaAll_NaoRestringe', () => {
    expect(filter({ category: 'all' })).toHaveLength(sample.length);
  });

  it('filterGalleryItems_CategoriaUncategorized_MantemSemTipo', () => {
    expect(titles(filter({ category: 'Uncategorized' }))).toEqual(['Sem categoria']);
  });

  it('filterGalleryItems_TagModeAnd_ExigeTodasIncludeTagIds', () => {
    expect(titles(filter({ tagMode: 'and', includeTagIds: [tagHero, tagMagic] }))).toEqual([
      'Espada Longa',
    ]);
  });

  it('filterGalleryItems_TagModeAnd_FaltaUmaTag_Exclui', () => {
    expect(titles(filter({ tagMode: 'and', includeTagIds: [tagHero, tagMap] }))).toEqual([]);
  });

  it('filterGalleryItems_TagModeOr_MantemSeTiverAoMenosUma', () => {
    expect(titles(filter({ tagMode: 'or', includeTagIds: [tagMagic, tagMap] }))).toEqual([
      'Espada Longa',
      'Carta do Destino',
      'Castelo Antigo',
    ]);
  });

  it('filterGalleryItems_TagModeOr_NenhumaInclude_Exclui', () => {
    expect(titles(filter({ tagMode: 'or', includeTagIds: [tagHidden] }))).toEqual(['Retrato Oculto']);
    expect(titles(filter({ tagMode: 'or', includeTagIds: ['tag-ausente'] }))).toEqual([]);
  });

  it('filterGalleryItems_IncludeTagIdsVazio_NaoRestringeInclusao', () => {
    expect(filter({ tagMode: 'and', includeTagIds: [] })).toHaveLength(sample.length);
    expect(filter({ tagMode: 'or', includeTagIds: [] })).toHaveLength(sample.length);
  });

  it('filterGalleryItems_ExcludeTagIds_ExcluiSeTiverQualquerUma', () => {
    expect(titles(filter({ excludeTagIds: [tagHidden] }))).toEqual([
      'Espada Longa',
      'Guarda Real',
      'Carta do Destino',
      'Castelo Antigo',
      'Sem categoria',
    ]);
  });

  it('filterGalleryItems_ExcludeTagIdsVazio_NaoExclui', () => {
    expect(filter({ excludeTagIds: [] })).toHaveLength(sample.length);
  });

  it('filterGalleryItems_ExcludeComVarias_ExcluiUniao', () => {
    expect(titles(filter({ excludeTagIds: [tagHidden, tagMap] }))).not.toContain('Castelo Antigo');
    expect(titles(filter({ excludeTagIds: [tagHidden, tagMap] }))).not.toContain('Retrato Oculto');
    expect(titles(filter({ excludeTagIds: [tagHidden, tagMap] }))).toEqual([
      'Espada Longa',
      'Guarda Real',
      'Carta do Destino',
      'Sem categoria',
    ]);
  });

  it('filterGalleryItems_CombinacaoNomeCategoriaAndNot_AplicaTodos', () => {
    const result = filter({
      nameQuery: 'guarda',
      category: 'Npc',
      tagMode: 'and',
      includeTagIds: [tagHero],
      excludeTagIds: [tagHidden],
    });

    expect(titles(result)).toEqual(['Guarda Real']);
  });

  it('filterGalleryItems_CombinacaoOrENot_ExcluiMesmoComInclude', () => {
    expect(
      titles(
        filter({
          tagMode: 'or',
          includeTagIds: [tagHero],
          excludeTagIds: [tagHidden],
        }),
      ),
    ).toEqual(['Espada Longa', 'Guarda Real']);
  });

  it('filterGalleryItems_CombinacaoNomeECategoria_ExigeOsDois', () => {
    expect(titles(filter({ nameQuery: 'guarda', category: 'Npc' }))).toEqual(['Guarda Real']);
    expect(filter({ nameQuery: 'guarda', category: 'Item' })).toEqual([]);
  });

  it('filterGalleryItems_ItemSemTags_PassaQuandoIncludeVazio', () => {
    expect(titles(filter({ nameQuery: 'sem categoria' }))).toEqual(['Sem categoria']);
  });
});
