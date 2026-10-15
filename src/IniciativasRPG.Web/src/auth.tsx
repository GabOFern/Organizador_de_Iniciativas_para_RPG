import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setTokenProvider } from './api';
import { config } from './config';

interface AuthState {
  token: string | null;
  campaignId: string | null;
  campaignName: string | null;
  campaignPublicToken: string | null;
  loginCampaign: (campaignId: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(config.authTokenStorageKey),
  );
  const [campaignId, setCampaignId] = useState<string | null>(() =>
    sessionStorage.getItem(config.authCampaignIdKey),
  );
  const [campaignName, setCampaignName] = useState<string | null>(() =>
    sessionStorage.getItem(config.authCampaignNameKey),
  );
  const [campaignPublicToken, setCampaignPublicToken] = useState<string | null>(() =>
    sessionStorage.getItem(config.authCampaignTokenKey),
  );

  setTokenProvider(() => token);

  const loginCampaign = useCallback(async (id: string, password: string) => {
    const result = await api.masterLogin(id, password);
    sessionStorage.setItem(config.authTokenStorageKey, result.token);
    sessionStorage.setItem(config.authCampaignIdKey, result.campaignId);
    sessionStorage.setItem(config.authCampaignNameKey, result.campaignName);
    sessionStorage.setItem(config.authCampaignTokenKey, result.publicToken);
    setToken(result.token);
    setCampaignId(result.campaignId);
    setCampaignName(result.campaignName);
    setCampaignPublicToken(result.publicToken);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(config.authTokenStorageKey);
    sessionStorage.removeItem(config.authCampaignIdKey);
    sessionStorage.removeItem(config.authCampaignNameKey);
    sessionStorage.removeItem(config.authCampaignTokenKey);
    setToken(null);
    setCampaignId(null);
    setCampaignName(null);
    setCampaignPublicToken(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      campaignId,
      campaignName,
      campaignPublicToken,
      loginCampaign,
      logout,
      isAuthenticated: Boolean(token && campaignId),
    }),
    [token, campaignId, campaignName, campaignPublicToken, loginCampaign, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
}
