import { characterClassLabels } from './config';

/** Temas UI (FR-033): padrão + 12 classes. Independente da classe da ficha (FR-034). */
export const uiThemes = [
  'Default',
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

export type UiTheme = (typeof uiThemes)[number];

type ClassTheme = Exclude<UiTheme, 'Default'>;

function classThemeLabels(): Record<ClassTheme, string> {
  const labels = {} as Record<ClassTheme, string>;
  for (const theme of uiThemes) {
    if (theme === 'Default') continue;
    labels[theme] = characterClassLabels[theme];
  }
  return labels;
}

/** Labels de classe vêm de characterClassLabels; Default é só o tema padrão. */
export const uiThemeLabels: Record<UiTheme, string> = {
  Default: 'Padrão',
  ...classThemeLabels(),
};

export function isUiTheme(value: string | null | undefined): value is UiTheme {
  return !!value && (uiThemes as readonly string[]).includes(value);
}
