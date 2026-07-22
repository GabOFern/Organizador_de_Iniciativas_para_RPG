import { uiThemeLabels, uiThemes, type UiTheme } from '../themes';
import { useTheme } from '../theme';

export function ThemePicker({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <label className={className ? `theme-picker ${className}` : 'theme-picker'}>
      <span className="theme-picker-label">Tema</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as UiTheme)}
        aria-label="Tema visual da interface"
      >
        {uiThemes.map((id) => (
          <option key={id} value={id}>
            {uiThemeLabels[id]}
          </option>
        ))}
      </select>
    </label>
  );
}
