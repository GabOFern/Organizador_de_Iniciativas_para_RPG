import { describe, expect, it, vi } from 'vitest';
import {
  buildPublicBattleUrl,
  fetchShareOrigin,
  normalizeShareOrigin,
  resolvePublicBattleUrl,
} from '../shareOrigin';

describe('shareOrigin', () => {
  it('normalizeShareOrigin_removeTrailingSlashAndRejectsJunk', () => {
    expect(normalizeShareOrigin('https://abc.trycloudflare.com/')).toBe(
      'https://abc.trycloudflare.com',
    );
    expect(normalizeShareOrigin('  https://abc.trycloudflare.com  ')).toBe(
      'https://abc.trycloudflare.com',
    );
    expect(normalizeShareOrigin('not-a-url')).toBeNull();
    expect(normalizeShareOrigin('')).toBeNull();
  });

  it('buildPublicBattleUrl_appendPublicPath', () => {
    expect(buildPublicBattleUrl('https://abc.trycloudflare.com', 'tok123')).toBe(
      'https://abc.trycloudflare.com/publico/tok123',
    );
  });

  it('resolvePublicBattleUrl_prefersShareOriginOverFallback', () => {
    expect(
      resolvePublicBattleUrl(
        'tok',
        'https://share.trycloudflare.com',
        'http://localhost:5173',
      ),
    ).toBe('https://share.trycloudflare.com/publico/tok');

    expect(resolvePublicBattleUrl('tok', null, 'http://localhost:5173')).toBe(
      'http://localhost:5173/publico/tok',
    );

    expect(resolvePublicBattleUrl(null, 'https://x.trycloudflare.com', 'http://localhost:5173')).toBeNull();
  });

  it('fetchShareOrigin_readsTextFile', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'https://xyz.trycloudflare.com/\n',
    });
    await expect(fetchShareOrigin(fetchImpl as unknown as typeof fetch)).resolves.toBe(
      'https://xyz.trycloudflare.com',
    );
  });
});
