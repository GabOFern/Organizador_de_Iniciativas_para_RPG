const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const hubUrl = import.meta.env.VITE_HUB_URL;

// String vazia = mesma origem (útil com proxy do Vite + ngrok).
if (apiBaseUrl === undefined || apiBaseUrl === null) {
  throw new Error('VITE_API_BASE_URL não configurada. Copie .env.example para .env.');
}

if (hubUrl === undefined || hubUrl === null) {
  throw new Error('VITE_HUB_URL não configurada. Copie .env.example para .env.');
}

export function resolveApiUrl(url: string): string {
  if (url.startsWith('/')) {
    return `${apiBaseUrl}${url}`;
  }

  return url;
}

export const config = {
  apiBaseUrl: apiBaseUrl as string,
  hubUrl: hubUrl as string,
  authTokenStorageKey: 'iniciativasrpg.authToken',
  authCampaignIdKey: 'iniciativasrpg.campaignId',
  authCampaignNameKey: 'iniciativasrpg.campaignName',
  authCampaignTokenKey: 'iniciativasrpg.campaignPublicToken',
  /** Somente sessionStorage — tema não persiste após fechar o navegador (ST-033). */
  themeSessionKey: 'iniciativasrpg.uiTheme',
} as const;

export const routes = {
  home: '/',
  login: '/login',
  mestre: '/mestre',
  mestreSheets: '/mestre/fichas',
  mestreBattle: '/mestre/batalha',
  mestreModifiers: '/mestre/modificadores',
  publicLobby: '/',
  publicBattle: (token: string) => `/publico/${token}`,
} as const;

export const characterClasses = [
  'None',
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard',
] as const;

export const characterClassLabels: Record<(typeof characterClasses)[number], string> = {
  None: 'Nenhuma',
  Barbarian: 'Bárbaro',
  Bard: 'Bardo',
  Cleric: 'Clérigo',
  Druid: 'Druida',
  Fighter: 'Guerreiro',
  Monk: 'Monge',
  Paladin: 'Paladino',
  Ranger: 'Patrulheiro',
  Rogue: 'Ladino',
  Sorcerer: 'Feiticeiro',
  Warlock: 'Bruxo',
  Wizard: 'Mago',
};

export const abilityNames = [
  'Strength',
  'Dexterity',
  'Constitution',
  'Intelligence',
  'Wisdom',
  'Charisma',
] as const;

export const abilityLabels: Record<(typeof abilityNames)[number], string> = {
  Strength: 'Força',
  Dexterity: 'Destreza',
  Constitution: 'Constituição',
  Intelligence: 'Inteligência',
  Wisdom: 'Sabedoria',
  Charisma: 'Carisma',
};

export const defaultProficiencyBonus = 2;

export const sheetImageUrlMaxLength = 1000;
export const sheetImageMaxBytes = 4 * 1024 * 1024;
export const sheetImageAccept = 'image/jpeg,image/png,image/webp,image/gif';
export const sheetImageSourceConflict = 'Use o link ou o arquivo.';
export const sheetImageTooLarge = 'A imagem passa de 4 MB.';
export const sheetImageTypeInvalid = 'Use uma imagem jpeg, png, webp ou gif.';

export function formatModifier(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

export function attackHitBonus(proficiencyBonus: number, abilityModifier: number) {
  return proficiencyBonus + abilityModifier;
}

export function abilityModifierOf(
  ability: string,
  mods: {
    strengthMod: number;
    dexterityMod: number;
    constitutionMod: number;
    intelligenceMod: number;
    wisdomMod: number;
    charismaMod: number;
  },
) {
  switch (ability) {
    case 'Dexterity':
      return mods.dexterityMod;
    case 'Constitution':
      return mods.constitutionMod;
    case 'Intelligence':
      return mods.intelligenceMod;
    case 'Wisdom':
      return mods.wisdomMod;
    case 'Charisma':
      return mods.charismaMod;
    default:
      return mods.strengthMod;
  }
}

export function formatAttackHit(
  ability: string,
  mods: {
    strengthMod: number;
    dexterityMod: number;
    constitutionMod: number;
    intelligenceMod: number;
    wisdomMod: number;
    charismaMod: number;
  },
  proficiencyBonus: number,
) {
  const modifier = abilityModifierOf(ability, mods);
  const hit = attackHitBonus(proficiencyBonus, modifier);
  const label = abilityLabels[ability as (typeof abilityNames)[number]] ?? ability;
  return `${label} ${formatModifier(modifier)} · acerto ${formatModifier(hit)}`;
}

export const strikeTypes = ['Melee', 'Ranged'] as const;

export const strikeTypeLabels: Record<(typeof strikeTypes)[number], string> = {
  Melee: 'Corpo a corpo',
  Ranged: 'À distância',
};

export const sheetFeatureKinds = [
  'Trait',
  'Resistance',
  'Immunity',
  'Vulnerability',
  'Sense',
  'Speed',
  'DifficultyClass',
  'Legendary',
  'Note',
  'Annotation',
] as const;

export const sheetFeatureKindLabels: Record<(typeof sheetFeatureKinds)[number], string> = {
  Trait: 'Traço',
  Resistance: 'Resistência',
  Immunity: 'Imunidade',
  Vulnerability: 'Vulnerabilidade',
  Sense: 'Sentido',
  Speed: 'Deslocamento',
  DifficultyClass: 'CD',
  Legendary: 'Lendário',
  Note: 'Nota',
  Annotation: 'Anotação',
};

export const sheetFeatureTextMaxLength = 1000;
export const sheetAnnotationTextMaxLength = 8000;

export function sheetFeatureTextLimit(kind: (typeof sheetFeatureKinds)[number]) {
  return kind === 'Annotation' ? sheetAnnotationTextMaxLength : sheetFeatureTextMaxLength;
}

export const sheetAnnotationHint =
  'Markdown: **negrito**, _itálico_, listas, títulos e links. É o espaço para dicas, combos e história.';
