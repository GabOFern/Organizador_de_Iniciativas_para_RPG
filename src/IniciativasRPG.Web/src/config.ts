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
  authUserStorageKey: 'iniciativasrpg.authUser',
} as const;

export const routes = {
  login: '/login',
  mestre: '/mestre',
  mestreSheets: '/mestre/fichas',
  mestreBattle: '/mestre/batalha',
  mestreModifiers: '/mestre/modificadores',
  publicLobby: '/publico',
  publicBattle: (token: string) => `/publico/${token}`,
} as const;
