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

export interface LoginResponse {
  token: string;
  username: string;
}
