export type SheetType = 'Player' | 'Creature' | 'Npc';
export type DamageMode = 'None' | 'Fixed' | 'DicePerTurn' | 'DiceOnce';
export type CharacterClass =
  | 'None'
  | 'Barbarian'
  | 'Bard'
  | 'Cleric'
  | 'Druid'
  | 'Fighter'
  | 'Monk'
  | 'Paladin'
  | 'Ranger'
  | 'Rogue'
  | 'Sorcerer'
  | 'Warlock'
  | 'Wizard';

export type AbilityName =
  | 'Strength'
  | 'Dexterity'
  | 'Constitution'
  | 'Intelligence'
  | 'Wisdom'
  | 'Charisma';

export type StrikeType = 'Melee' | 'Ranged';

export type SheetFeatureKind =
  | 'Trait'
  | 'Resistance'
  | 'Immunity'
  | 'Vulnerability'
  | 'Sense'
  | 'Speed'
  | 'DifficultyClass'
  | 'Legendary'
  | 'Note'
  | 'Annotation';

export interface SheetFeature {
  id?: string | null;
  kind: SheetFeatureKind | string;
  title: string;
  text: string;
  sortOrder: number;
}

export interface SheetAttack {
  id?: string | null;
  description: string;
  damageDice: string;
  abilityBase: AbilityName | string;
  strikeType: StrikeType | string;
  sortOrder: number;
}

export interface SheetSpell {
  id?: string | null;
  description: string;
  damageDice: string | null;
  slotLevel: number;
  requiresMaterial: boolean;
  abilityBase: AbilityName | string;
  sortOrder: number;
}

export interface SheetWeapon {
  id?: string | null;
  description: string;
  damageDice: string;
  range: string;
  strikeType: StrikeType | string;
  sortOrder: number;
}

export interface Sheet {
  id: string;
  name: string;
  playerName?: string | null;
  imageUrl: string | null;
  imageFocusX: number;
  imageFocusY: number;
  imageScale: number;
  type: SheetType;
  class: CharacterClass | string;
  maxHp: number;
  currentHp: number;
  baseAc: number;
  dexModifier: number;
  initiativeBonus: number;
  proficiencyBonus: number;
  strength: number;
  strengthMod: number;
  dexterity: number;
  dexterityMod: number;
  constitution: number;
  constitutionMod: number;
  intelligence: number;
  intelligenceMod: number;
  wisdom: number;
  wisdomMod: number;
  charisma: number;
  charismaMod: number;
  features: SheetFeature[];
  attacks: SheetAttack[];
  spells: SheetSpell[];
  weapons: SheetWeapon[];
  hasStoredImage: boolean;
}

export interface SheetPayload {
  name: string;
  playerName?: string | null;
  imageUrl?: string | null;
  imageFocusX?: number;
  imageFocusY?: number;
  imageScale?: number;
  type: SheetType;
  class: CharacterClass;
  maxHp: number;
  currentHp?: number;
  baseAc: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  initiativeBonus?: number;
  proficiencyBonus?: number;
  features?: Array<{
    kind: SheetFeatureKind;
    title: string;
    text: string;
  }>;
  attacks?: Array<{
    description: string;
    damageDice: string;
    abilityBase: AbilityName;
    strikeType: StrikeType;
  }>;
  spells?: Array<{
    description: string;
    damageDice?: string | null;
    slotLevel: number;
    requiresMaterial: boolean;
    abilityBase: AbilityName;
  }>;
  weapons?: Array<{
    description: string;
    damageDice: string;
    range: string;
    strikeType: StrikeType;
  }>;
}

export interface CampaignSummary {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  publicToken: string;
  createdAtUtc: string;
}

export interface CampaignMasterLoginResponse {
  token: string;
  campaignId: string;
  campaignName: string;
  publicToken: string;
}

export interface CombatantTactical {
  combatantId: string;
  sheetId: string;
  name: string;
  sheetType: string;
  class: string;
  strength: number;
  strengthMod: number;
  dexterity: number;
  dexterityMod: number;
  constitution: number;
  constitutionMod: number;
  intelligence: number;
  intelligenceMod: number;
  wisdom: number;
  wisdomMod: number;
  charisma: number;
  charismaMod: number;
  proficiencyBonus: number;
  features: SheetFeature[];
  attacks: SheetAttack[];
  spells: SheetSpell[];
  weapons: SheetWeapon[];
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
  imageFocusX: number;
  imageFocusY: number;
  imageScale: number;
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
  isTestBattle?: boolean;
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

export type SceneKind = 'Uncategorized' | 'Item' | 'Npc' | 'Card' | 'Map';

export type SceneKindFilter = 'all' | SceneKind;

export interface CampaignScene {
  id: string;
  title: string;
  imageUrl: string;
  sortOrder: number;
  isVisibleToPlayers: boolean;
  kind: SceneKind;
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
