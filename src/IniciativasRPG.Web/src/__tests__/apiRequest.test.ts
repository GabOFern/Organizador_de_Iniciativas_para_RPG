import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError } from '../api';
import { requestFailedMessage } from '../config';
import { logger } from '../logger';

describe('api request', () => {
  const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
  const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    errorSpy.mockClear();
    warnSpy.mockClear();
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

  it('imagem HTTP 400 loga aviso com a mensagem do link', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: 'Não foi possível usar a imagem desse link.' }),
      }),
    );

    await expect(api.fetchAuthorizedBlob('/api/scenes/s1/image')).rejects.toMatchObject({
      message: 'Não foi possível usar a imagem desse link.',
      status: 400,
    });
    expect(warnSpy).toHaveBeenCalled();
    expect(String(warnSpy.mock.calls[0]?.[0])).toContain('400');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('imagem HTTP 500 loga erro interno', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'boom',
      }),
    );

    await expect(api.fetchAuthorizedBlob('/api/scenes/s1/image')).rejects.toMatchObject({
      status: 500,
    });
    expect(errorSpy).toHaveBeenCalled();
    expect(String(errorSpy.mock.calls[0]?.[0])).toContain('500');
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
