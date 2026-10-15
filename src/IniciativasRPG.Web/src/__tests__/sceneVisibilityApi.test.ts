import { describe, it, expect, vi, afterEach } from 'vitest';
import { api } from '../api';

describe('api.setSceneVisibility', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('SetSceneVisibility_ChamaPATCH_ComBodyCorreto', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });
    vi.stubGlobal('fetch', fetchMock);

    await api.setSceneVisibility('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', true);

    expect(fetchMock).toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/scenes/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/visibility');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body))).toEqual({ isVisibleToPlayers: true });
  });
});
