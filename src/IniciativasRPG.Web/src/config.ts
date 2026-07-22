const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const hubUrl = import.meta.env.VITE_HUB_URL;

// String vazia = mesma origem (útil com proxy do Vite + ngrok).
if (apiBaseUrl === undefined || apiBaseUrl === null) {
  throw new Error('VITE_API_BASE_URL não configurada. Copie .env.example para .env.');
}

if (hubUrl === undefined || hubUrl === null) {
  throw new Error('VITE_HUB_URL não configurada. Copie .env.example para .env.');
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

export const strikeTypes = ['Melee', 'Ranged'] as const;

export const strikeTypeLabels: Record<(typeof strikeTypes)[number], string> = {
  Melee: 'Corpo a corpo',
  Ranged: 'À distância',
};
