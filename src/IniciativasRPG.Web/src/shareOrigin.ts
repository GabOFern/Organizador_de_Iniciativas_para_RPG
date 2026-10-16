import { routes } from './config';

/** Servido pelo Vite a partir de public/share-origin.txt (escrito pelo iniciar.bat /publico). */
export const shareOriginPath = '/share-origin.txt';

export function normalizeShareOrigin(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!/^https?:\/\/[^\s]+$/i.test(trimmed)) return null;
  return trimmed;
}

export function buildPublicBattleUrl(origin: string, publicToken: string): string {
  const base = normalizeShareOrigin(origin) ?? origin.replace(/\/+$/, '');
  return `${base}${routes.publicBattle(publicToken)}`;
}

export async function fetchShareOrigin(
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  try {
    const response = await fetchImpl(shareOriginPath, { cache: 'no-store' });
    if (!response.ok) return null;
    return normalizeShareOrigin(await response.text());
  } catch {
    return null;
  }
}

export function resolvePublicBattleUrl(
  publicToken: string | null | undefined,
  shareOrigin: string | null | undefined,
  fallbackOrigin: string,
): string | null {
  if (!publicToken) return null;
  const origin = normalizeShareOrigin(shareOrigin) ?? normalizeShareOrigin(fallbackOrigin);
  if (!origin) return null;
  return buildPublicBattleUrl(origin, publicToken);
}
