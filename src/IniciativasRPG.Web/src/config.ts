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

/** Falhas transitórias na home antes de mostrar erro vermelho. */
export const campaignsLoadMaxConsecutiveFailures = 3;
export const campaignsLoadingMessage = 'Carregando dados…';
export const campaignsLoadFailedMessage = 'Falha ao carregar campanhas.';
export const requestFailedMessage = 'Falha na requisição.';

export const sheetPlayerNameLabel = 'Nome do jogador';
export const sheetPlayerNameMaxLength = 80;
export const sheetPlayerNameTooLong = 'O nome do jogador é longo demais.';
export const sheetDeleteConfirmMessage = 'Excluir esta ficha? Esta ação não pode ser desfeita.';
export const sheetDeletedMessage = 'Ficha excluída.';
export const sheetDeleteFailedMessage = 'Falha ao excluir ficha.';

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
export const sheetImageStoredMaxBytes = 4 * 1024 * 1024;
export const sheetImageUploadMaxBytes = 20 * 1024 * 1024;
export const sheetImageMaxBytes = sheetImageUploadMaxBytes;

export function imageExceedsUploadLimit(size: number) {
  return size > sheetImageUploadMaxBytes;
}
export const sheetImageAccept = 'image/jpeg,image/png,image/webp,image/gif';
export const sheetImageSourceConflict = 'Use o link ou o arquivo.';
export const sheetImageTooLarge = 'A imagem passa de 20 MB.';
export const sheetImageTypeInvalid = 'Use uma imagem jpeg, png, webp ou gif.';
/** 1 preenche o card. Abaixo disso a imagem mostra mais, até caber inteira. */
export const sheetImageScaleDefault = 1;
export const sheetImageScaleMin = 0.05;
export const sheetImageScaleMax = 4;
export const sheetImageScaleStep = 1.25;
/** Um notch típico da roda (deltaY 100) equivale a um passo de zoom. */
export const sheetImageScaleWheelDivisor = 100;
export const sheetImageFocusCenter = 50;
export const sceneTitleMaxLength = 120;
export const sceneImageUrlMaxLength = sheetImageUrlMaxLength;
export const sceneImageMaxBytes = sheetImageMaxBytes;
export const sceneImageAccept = sheetImageAccept;
export const sceneTitleRequired = 'O título da imagem é obrigatório.';
export const sceneTitleTooLong = 'O título da imagem é longo demais.';
export const sceneImageSourceRequired = 'Informe o link ou o arquivo.';
export const sceneImageSourceConflict = sheetImageSourceConflict;
export const sceneImageUrlInvalid = 'O link da imagem precisa ser http ou https.';
export const sceneEmptyMessage = 'Nenhuma imagem nesta sessão.';
export const sceneZoomMin = 1;
export const sceneZoomMax = 4;
export const sceneZoomStep = 1.25;
/** Um notch típico da roda (deltaY 100) equivale a um passo de zoom. */
export const sceneZoomWheelDivisor = 100;
export const sceneSeenStorageKeyPrefix = 'iniciativasrpg.sceneSeen.';
export const sceneVisibilityShowLabel = 'Mostrar aos jogadores';
export const sceneVisibilityHideLabel = 'Ocultar dos jogadores';
export const sceneLauncherLabel = 'Imagens';
export function sceneLauncherAriaLabel(unseenCount: number) {
  if (unseenCount <= 0) return sceneLauncherLabel;
  return `${sceneLauncherLabel}, ${unseenCount} nova${unseenCount === 1 ? '' : 's'}`;
}
export const sceneKindRequired = 'Escolha o tipo da imagem.';
export const sceneKindLabel = 'Tipo';
export const sceneFilterNameLabel = 'Filtrar por nome';
export const sceneFilterKindLabel = 'Filtrar por tipo';
export const sceneFilterAllLabel = 'Todos';
export const sceneKindUncategorizedLabel = 'Sem tipo';
export const sceneEditLabel = 'Editar';
export const sceneSaveLabel = 'Salvar';
export const sceneCancelEditLabel = 'Cancelar';
export const sceneIncludeLabel = 'Incluir';
export const sceneKindOptions = [
  { value: 'Item' as const, label: 'Item' },
  { value: 'Npc' as const, label: 'NPC' },
  { value: 'Card' as const, label: 'Carta' },
  { value: 'Map' as const, label: 'Mapa/Construção' },
];
export const sceneKindLabels: Record<string, string> = {
  Uncategorized: sceneKindUncategorizedLabel,
  Item: 'Item',
  Npc: 'NPC',
  Card: 'Carta',
  Map: 'Mapa/Construção',
};
export function sceneKindDisplayLabel(kind: string) {
  return sceneKindLabels[kind] ?? sceneKindUncategorizedLabel;
}

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
