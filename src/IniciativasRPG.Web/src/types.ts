export type SheetType = 'Player' | 'Creature' | 'Npc';
export type DamageMode = 'None' | 'Fixed' | 'DicePerTurn' | 'DiceOnce';

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
  iconKey: string;
  iconUrl: string | null;
  acDelta: number;
  damageMode: DamageMode | string;
  damageAmount: number | null;
  damageDice: string | null;
  resolvedDamage: number | null;
  lastTickDamage: number | null;
  healMode: DamageMode | string;
  healAmount: number | null;
  healDice: string | null;
  resolvedHeal: number | null;
  lastTickHeal: number | null;
}

export interface ModifierTickEvent {
  combatantId: string;
  combatantName: string;
  modifierId: string;
  modifierName: string;
  amount: number;
  kind: 'Damage' | 'Heal' | string;
  rollDetail: string | null;
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
  hideHpFromPublic: boolean;
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
  lastTickEvents?: ModifierTickEvent[] | null;
  canSavePlayerStats?: boolean;
}

export interface ModifierType {
  id: string;
  name: string;
  defaultDuration: number;
  skipsTurn: boolean;
  iconKey: string;
  iconUrl: string | null;
  acDelta: number;
  damageMode: DamageMode | string;
  damageAmount: number | null;
  damageDice: string | null;
  healMode: DamageMode | string;
  healAmount: number | null;
  healDice: string | null;
}

export interface ModifierTypePayload {
  name: string;
  defaultDuration: number;
  skipsTurn: boolean;
  iconKey: string;
  iconUrl: string | null;
  acDelta: number;
  damageMode: DamageMode;
  damageAmount: number | null;
  damageDice: string | null;
  healMode: DamageMode;
  healAmount: number | null;
  healDice: string | null;
}

export interface LoginResponse {
  token: string;
  username: string;
}
