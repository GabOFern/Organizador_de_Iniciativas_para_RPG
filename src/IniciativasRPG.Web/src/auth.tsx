import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setTokenProvider } from './api';
import { config } from './config';

interface AuthState {
  token: string | null;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

function readSessionToken() {
  return sessionStorage.getItem(config.authTokenStorageKey);
}

function readSessionUser() {
  return sessionStorage.getItem(config.authUserStorageKey);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readSessionToken());
  const [username, setUsername] = useState<string | null>(() => readSessionUser());

  useEffect(() => {
    setTokenProvider(() => token);
  }, [token]);

  const login = useCallback(async (user: string, password: string) => {
    const result = await api.login(user, password);
    sessionStorage.setItem(config.authTokenStorageKey, result.token);
    sessionStorage.setItem(config.authUserStorageKey, result.username);
    setToken(result.token);
    setUsername(result.username);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(config.authTokenStorageKey);
    sessionStorage.removeItem(config.authUserStorageKey);
    setToken(null);
    setUsername(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      username,
      login,
      logout,
      isAuthenticated: Boolean(token),
    }),
    [token, username, login, logout],
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
