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

export const uiThemeLabels: Record<UiTheme, string> = {
  Default: 'Padrão',
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

export function isUiTheme(value: string | null | undefined): value is UiTheme {
  return !!value && (uiThemes as readonly string[]).includes(value);
}
