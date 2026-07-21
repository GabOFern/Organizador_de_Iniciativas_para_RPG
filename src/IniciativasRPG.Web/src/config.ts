const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const hubUrl = import.meta.env.VITE_HUB_URL;

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL não configurada. Copie .env.example para .env.');
}

if (!hubUrl) {
  throw new Error('VITE_HUB_URL não configurada. Copie .env.example para .env.');
}

export const config = {
  apiBaseUrl: apiBaseUrl as string,
  hubUrl: hubUrl as string,
  authTokenStorageKey: 'iniciativasrpg.authToken',
  authUserStorageKey: 'iniciativasrpg.authUser',
} as const;

export const routes = {
  login: '/login',
  mestre: '/mestre',
  mestreSheets: '/mestre/fichas',
  mestreBattle: '/mestre/batalha',
  mestreModifiers: '/mestre/modificadores',
  publicBattle: (token: string) => `/publico/${token}`,
} as const;
