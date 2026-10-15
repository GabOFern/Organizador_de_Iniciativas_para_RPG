import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError } from '../api';
import { requestFailedMessage } from '../config';
import { logger } from '../logger';

describe('api request', () => {
  const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

  beforeEach(() => {
    errorSpy.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('A1: HTTP 502 sem JSON error lança default e loga ERROR', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        text: async () => '<html>Bad Gateway</html>',
      }),
    );

    await expect(api.listCampaigns()).rejects.toMatchObject({
      message: requestFailedMessage,
      status: 502,
    });
    expect(errorSpy).toHaveBeenCalled();
    expect(String(errorSpy.mock.calls[0]?.[0])).toContain('502');
  });

  it('A2: HTTP 400 com { error } usa mensagem do servidor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: 'O nome é obrigatório.' }),
      }),
    );

    await expect(api.listCampaigns()).rejects.toMatchObject({
      message: 'O nome é obrigatório.',
      status: 400,
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it('A3: HTTP 200 retorna dados sem ERROR', async () => {
    const payload = [{ id: '1', name: 'Campanha' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => payload,
      }),
    );

    const result = await api.listCampaigns();
    expect(result).toEqual(payload);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('rede rejeitada vira ApiError e loga', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Failed to fetch')),
    );

    await expect(api.listCampaigns()).rejects.toBeInstanceOf(ApiError);
    expect(errorSpy).toHaveBeenCalled();
  });
});
