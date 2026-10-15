import type { CampaignScene, SceneKindFilter } from './types';

export function filterScenes(
  scenes: CampaignScene[],
  options: { nameQuery: string; kind: SceneKindFilter },
): CampaignScene[] {
  const query = options.nameQuery.trim().toLowerCase();

  return scenes.filter((scene) => {
    if (options.kind !== 'all' && scene.kind !== options.kind) {
      return false;
    }
    if (query && !scene.title.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });
}
