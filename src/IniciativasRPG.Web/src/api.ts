import { config, requestFailedMessage } from './config';
import { logger } from './logger';
import type {
  BattleSnapshot,
  CampaignMasterLoginResponse,
  CampaignSummary,
  CombatantTactical,
  ModifierType,
  ModifierTypePayload,
  CampaignScene,
  InvokeLineupPayload,
  Lineup,
  SaveLineupPayload,
  Sheet,
  SheetPayload,
} from './types';

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

type TokenProvider = () => string | null;

let tokenProvider: TokenProvider = () => null;

export function setTokenProvider(provider: TokenProvider) {
  tokenProvider = provider;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = tokenProvider();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${config.apiBaseUrl}${path}`, {
      ...init,
      headers,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    logger.error(`GET/POST ${path} rede: ${detail}`);
    throw new ApiError(requestFailedMessage, 0, detail);
  }

  if (!response.ok) {
    let message = requestFailedMessage;
    let detail: string | undefined;
    try {
      const raw = await response.text();
      detail = raw.slice(0, 500);
      try {
        const data = JSON.parse(raw) as { error?: string };
        if (data.error) message = data.error;
      } catch {
        /* body não é JSON */
      }
    } catch {
      /* ignore */
    }

    logger.error(`${init.method ?? 'GET'} ${path} HTTP ${response.status}: ${message}`);
    throw new ApiError(message, response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function fetchAuthorizedBlob(path: string): Promise<Blob> {
  const headers = new Headers();
  const token = tokenProvider();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${config.apiBaseUrl}${path}`, { headers });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    logger.error(`GET ${path} rede: ${detail}`);
    throw new ApiError(requestFailedMessage, 0, detail);
  }

  if (!response.ok) {
    const message = await readErrorMessage(response);
    const line = `GET ${path} HTTP ${response.status}: ${message}`;
    if (response.status >= 500) logger.error(line);
    else logger.warn(line);
    throw new ApiError(message, response.status);
  }

  return response.blob();
}

async function readErrorMessage(response: Response) {
  try {
    const raw = await response.text();
    const data = JSON.parse(raw) as { error?: string };
    if (data.error) return data.error;
  } catch {
    /* body não é JSON */
  }

  return requestFailedMessage;
}

export const api = {
  listCampaigns: () => request<CampaignSummary[]>('/api/campaigns'),

  createCampaign: (body: {
    name: string;
    imageUrl?: string | null;
    description?: string | null;
    password: string;
  }) =>
    request<CampaignSummary>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  masterLogin: (campaignId: string, password: string) =>
    request<CampaignMasterLoginResponse>(`/api/campaigns/${campaignId}/master-login`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  listSheets: () => request<Sheet[]>('/api/sheets'),

  createSheet: (body: SheetPayload) =>
    request<Sheet>('/api/sheets', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateSheet: (id: string, body: SheetPayload & { currentHp: number }) =>
    request<Sheet>(`/api/sheets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteSheet: (id: string) =>
    request<void>(`/api/sheets/${id}`, { method: 'DELETE' }),

  setSheetImage: (id: string, file: File) => {
    const body = new FormData();
    body.append('file', file);
    return request<Sheet>(`/api/sheets/${id}/image`, {
      method: 'POST',
      body,
    });
  },

  clearSheetImage: (id: string) =>
    request<Sheet>(`/api/sheets/${id}/image`, { method: 'DELETE' }),

  listScenes: () => request<CampaignScene[]>('/api/scenes'),

  fetchAuthorizedBlob: (path: string) => fetchAuthorizedBlob(path),

  listPublicScenes: (token: string) =>
    request<CampaignScene[]>(`/api/public/campaigns/${token}/scenes`),

  createScene: (body: {
    title: string;
    kind: string;
    imageUrl?: string;
    file?: File;
  }) => {
    const form = new FormData();
    form.append('title', body.title);
    form.append('kind', body.kind);
    if (body.imageUrl) form.append('imageUrl', body.imageUrl);
    if (body.file) form.append('file', body.file);
    return request<CampaignScene[]>('/api/scenes', { method: 'POST', body: form });
  },

  updateScene: (
    id: string,
    body: { title: string; kind: string; imageUrl?: string; file?: File },
  ) => {
    const form = new FormData();
    form.append('title', body.title);
    form.append('kind', body.kind);
    if (body.imageUrl) form.append('imageUrl', body.imageUrl);
    if (body.file) form.append('file', body.file);
    return request<CampaignScene[]>(`/api/scenes/${id}`, { method: 'PUT', body: form });
  },

  setSceneVisibility: (id: string, isVisibleToPlayers: boolean) =>
    request<CampaignScene[]>(`/api/scenes/${id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ isVisibleToPlayers }),
    }),

  deleteScene: (id: string) =>
    request<CampaignScene[]>(`/api/scenes/${id}`, { method: 'DELETE' }),

  listModifierTypes: () => request<ModifierType[]>('/api/modifier-types'),

  createModifierType: (body: ModifierTypePayload) =>
    request<ModifierType>('/api/modifier-types', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateModifierType: (id: string, body: ModifierTypePayload) =>
    request<ModifierType>(`/api/modifier-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteModifierType: (id: string) =>
    request<void>(`/api/modifier-types/${id}`, { method: 'DELETE' }),

  getCurrentBattle: () => request<BattleSnapshot>('/api/battle/current'),

  getPublicBattle: (token: string) =>
    request<BattleSnapshot>(`/api/public/campaigns/${token}`),

  getCombatantTactical: (combatantId: string) =>
    request<CombatantTactical>(`/api/battle/combatants/${combatantId}/tactical`),

  invokePlayer: (sheetId: string, initiative: number, confirmDuplicate = false) =>
    request<BattleSnapshot>('/api/battle/invoke-player', {
      method: 'POST',
      body: JSON.stringify({ sheetId, initiative, confirmDuplicate }),
    }),

  listLineups: () => request<Lineup[]>('/api/lineups'),

  createLineup: (body: SaveLineupPayload) =>
    request<Lineup>('/api/lineups', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateLineup: (id: string, body: SaveLineupPayload) =>
    request<Lineup>(`/api/lineups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteLineup: (id: string) =>
    request<void>(`/api/lineups/${id}`, { method: 'DELETE' }),

  invokeLineup: (body: InvokeLineupPayload) =>
    request<BattleSnapshot>('/api/battle/invoke-lineup', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  invokeCreature: (body: {
    sheetId: string;
    initiative?: number | null;
    rollDice: boolean;
    diceNotation?: string | null;
    hideHpFromPublic?: boolean;
  }) =>
    request<BattleSnapshot>('/api/battle/invoke-creature', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  startBattle: () =>
    request<BattleSnapshot>('/api/battle/start', { method: 'POST' }),

  startTestBattle: () =>
    request<BattleSnapshot>('/api/battle/test/start', { method: 'POST' }),

  tickTestBattle: () =>
    request<BattleSnapshot>('/api/battle/test/tick', { method: 'POST' }),

  nextTurn: () =>
    request<BattleSnapshot>('/api/battle/next', { method: 'POST' }),

  finishBattle: () =>
    request<BattleSnapshot>('/api/battle/finish', { method: 'POST' }),

  savePlayerStats: () =>
    request<BattleSnapshot>('/api/battle/save-player-stats', { method: 'POST' }),

  applyDamage: (combatantId: string, amount: number) =>
    request<BattleSnapshot>('/api/battle/damage', {
      method: 'POST',
      body: JSON.stringify({ combatantId, amount }),
    }),

  applyHeal: (combatantId: string, amount: number) =>
    request<BattleSnapshot>('/api/battle/heal', {
      method: 'POST',
      body: JSON.stringify({ combatantId, amount }),
    }),

  kill: (combatantId: string) =>
    request<BattleSnapshot>('/api/battle/kill', {
      method: 'POST',
      body: JSON.stringify({ combatantId }),
    }),

  revive: (combatantId: string, healAmount?: number) =>
    request<BattleSnapshot>('/api/battle/revive', {
      method: 'POST',
      body: JSON.stringify({ combatantId, healAmount: healAmount ?? null }),
    }),

  applyModifier: (combatantId: string, modifierTypeId: string, duration?: number) =>
    request<BattleSnapshot>('/api/battle/modifiers', {
      method: 'POST',
      body: JSON.stringify({
        combatantId,
        modifierTypeId,
        duration: duration ?? null,
      }),
    }),

  removeModifier: (activeModifierId: string) =>
    request<BattleSnapshot>(`/api/battle/modifiers/${activeModifierId}`, {
      method: 'DELETE',
    }),
};
