import { describe, expect, it } from 'vitest';
import { isMasterSceneImagePath } from '../sceneImage';

describe('isMasterSceneImagePath', () => {
  it('reconhece o caminho autenticado do mestre', () => {
    expect(isMasterSceneImagePath('/api/scenes/abc/image')).toBe(true);
  });

  it('deixa o caminho público para o img direto', () => {
    expect(
      isMasterSceneImagePath('/api/public/campaigns/tok/scenes/abc/image'),
    ).toBe(false);
  });
});
