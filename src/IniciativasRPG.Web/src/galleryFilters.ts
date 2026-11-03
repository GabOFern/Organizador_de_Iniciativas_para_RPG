import type { SceneKind, SceneKindFilter } from './types';

export type GalleryTagMode = 'and' | 'or';

export interface GalleryFilterTag {
  id: string;
}

export interface GalleryFilterItem {
  title: string;
  kind: SceneKind;
  tags?: readonly GalleryFilterTag[] | null;
}

export interface GalleryFilterOptions {
  nameQuery: string;
  category: SceneKindFilter;
  tagMode: GalleryTagMode;
  includeTagIds: string[];
  excludeTagIds: string[];
}

function itemTagIds(item: GalleryFilterItem): Set<string> {
  return new Set((item.tags ?? []).map((tag) => tag.id));
}

function matchesIncludedTags(
  tagIds: Set<string>,
  includeTagIds: string[],
  tagMode: GalleryTagMode,
): boolean {
  if (includeTagIds.length === 0) {
    return true;
  }

  if (tagMode === 'and') {
    return includeTagIds.every((id) => tagIds.has(id));
  }

  return includeTagIds.some((id) => tagIds.has(id));
}

export function filterGalleryItems<T extends GalleryFilterItem>(
  items: readonly T[],
  options: GalleryFilterOptions,
): T[] {
  const query = options.nameQuery.trim().toLocaleLowerCase();

  return items.filter((item) => {
    if (options.category !== 'all' && item.kind !== options.category) {
      return false;
    }

    if (query && !item.title.toLocaleLowerCase().includes(query)) {
      return false;
    }

    const tagIds = itemTagIds(item);

    if (options.excludeTagIds.some((id) => tagIds.has(id))) {
      return false;
    }

    return matchesIncludedTags(tagIds, options.includeTagIds, options.tagMode);
  });
}
