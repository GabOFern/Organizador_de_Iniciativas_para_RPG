export type SheetType = 'Player' | 'Creature';

export interface Sheet {
  id: string;
  name: string;
  imageUrl: string | null;
  type: SheetType;
  maxHp: number;
  currentHp: number;
  baseAc: number;
  dexModifier: number;
}

export interface ActiveModifier {
  id: string;
  name: string;
  remainingDuration: number;
  skipsTurn: boolean;
}

export interface Combatant {
  id: string;
  sheetId: string;
  name: string;
  imageUrl: string | null;
  sheetType: SheetType;
  initiative: number;
  currentHp: number;
  maxHp: number;
  currentAc: number;
  isDead: boolean;
  sortOrder: number;
  isCurrentTurn: boolean;
  modifiers: ActiveModifier[];
}

export interface BattleSnapshot {
  id: string | null;
  publicToken: string | null;
  status: 'Preparing' | 'Active' | 'Finished' | string;
  currentTurnIndex: number;
  combatants: Combatant[];
  message: string | null;
  lastDiceRoll: number | null;
}

export interface ModifierType {
  id: string;
  name: string;
  defaultDuration: number;
  skipsTurn: boolean;
}

export interface LoginResponse {
  token: string;
  username: string;
}
