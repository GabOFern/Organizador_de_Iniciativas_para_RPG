import { config } from './config';
import type {
  BattleSnapshot,
  LoginResponse,
  ModifierType,
  ModifierTypePayload,
  PublicBattleSummary,
  Sheet,
  SheetType,
} from './types';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type TokenProvider = () => string | null;

let tokenProvider: TokenProvider = () => null;

export function setTokenProvider(provider: TokenProvider) {
  tokenProvider = provider;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = tokenProvider();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = 'Falha na requisição.';
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  listSheets: () => request<Sheet[]>('/api/sheets'),

  createSheet: (body: {
    name: string;
    imageUrl?: string | null;
    type: SheetType;
    maxHp: number;
    baseAc: number;
    dexModifier: number;
  }) =>
    request<Sheet>('/api/sheets', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateSheet: (
    id: string,
    body: {
      name: string;
      imageUrl?: string | null;
      type: SheetType;
      maxHp: number;
      currentHp: number;
      baseAc: number;
      dexModifier: number;
    },
  ) =>
    request<Sheet>(`/api/sheets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

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

  listPublicBattles: () => request<PublicBattleSummary[]>('/api/public/battles'),

  getPublicBattle: (token: string) =>
    request<BattleSnapshot>(`/api/public/battles/${token}`),

  invokePlayer: (sheetId: string, initiative: number, confirmDuplicate = false) =>
    request<BattleSnapshot>('/api/battle/invoke-player', {
      method: 'POST',
      body: JSON.stringify({ sheetId, initiative, confirmDuplicate }),
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
