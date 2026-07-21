import { MODIFIER_ICON_LABELS, type ModifierIconKey } from '../modifierIcons';

interface ModifierIconProps {
  iconKey: string;
  iconUrl?: string | null;
  title?: string;
  className?: string;
}

const PRESET_GLYPH: Record<ModifierIconKey, string> = {
  generic: '◆',
  poison: '☠',
  fire: '♨',
  frost: '❄',
  bleed: '†',
  stun: '✦',
  shield_up: '▲',
  shield_down: '▼',
  holy: '✚',
  shadow: '◉',
  regen: '+',
};

export function ModifierIcon({ iconKey, iconUrl, title, className }: ModifierIconProps) {
  const key = (iconKey in PRESET_GLYPH ? iconKey : 'generic') as ModifierIconKey;
  const label = title ?? MODIFIER_ICON_LABELS[key];

  if (iconUrl) {
    return (
      <span className={`mod-icon ${className ?? ''}`} title={label}>
        <img src={iconUrl} alt="" className="mod-icon-img" />
      </span>
    );
  }

  return (
    <span className={`mod-icon mod-icon-${key} ${className ?? ''}`} title={label} aria-hidden>
      {PRESET_GLYPH[key]}
    </span>
  );
}
