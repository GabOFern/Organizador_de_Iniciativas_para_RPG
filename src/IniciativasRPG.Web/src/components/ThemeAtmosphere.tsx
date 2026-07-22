import { useTheme } from '../theme';
import { themeMotifs } from '../themeMotifs';

export function ThemeAtmosphere() {
  const { theme } = useTheme();
  const motifs = theme === 'Default' ? null : themeMotifs[theme];

  if (!motifs?.length) {
    return null;
  }

  return (
    <div className="theme-atmosphere" aria-hidden="true">
      {motifs.map((m) => (
        <div
          key={m.id}
          className="theme-motif"
          style={{
            top: m.top,
            bottom: m.bottom,
            left: m.left,
            right: m.right,
            width: m.size,
            height: m.size,
            opacity: m.opacity ?? 0.1,
            transform: m.rotate ? `rotate(${m.rotate})` : undefined,
          }}
        >
          {m.svg}
        </div>
      ))}
    </div>
  );
}
