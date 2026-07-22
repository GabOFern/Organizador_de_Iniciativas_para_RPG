import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ThemeAtmosphere } from './components/ThemeAtmosphere';
import { config } from './config';
import { isUiTheme, type UiTheme } from './themes';

interface ThemeState {
  theme: UiTheme;
  setTheme: (theme: UiTheme) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

function readSessionTheme(): UiTheme {
  try {
    const raw = sessionStorage.getItem(config.themeSessionKey);
    return isUiTheme(raw) ? raw : 'Default';
  } catch {
    return 'Default';
  }
}

function applyDocumentTheme(theme: UiTheme) {
  const root = document.documentElement;
  if (theme === 'Default') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<UiTheme>(() => readSessionTheme());

  useEffect(() => {
    applyDocumentTheme(theme);
    try {
      if (theme === 'Default') {
        sessionStorage.removeItem(config.themeSessionKey);
      } else {
        sessionStorage.setItem(config.themeSessionKey, theme);
      }
    } catch {
      /* ignore quota / private mode */
    }
  }, [theme]);

  const setTheme = useCallback((next: UiTheme) => {
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <ThemeAtmosphere />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  }
  return ctx;
}
