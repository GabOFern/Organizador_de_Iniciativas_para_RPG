export type DamageMode = 'None' | 'Fixed' | 'DicePerTurn' | 'DiceOnce';

export const MODIFIER_ICON_KEYS = [
  'generic',
  'poison',
  'fire',
  'frost',
  'bleed',
  'stun',
  'shield_up',
  'shield_down',
  'holy',
  'shadow',
  'regen',
] as const;

export type ModifierIconKey = (typeof MODIFIER_ICON_KEYS)[number];

export const MODIFIER_ICON_LABELS: Record<ModifierIconKey, string> = {
  generic: 'Genérico',
  poison: 'Veneno',
  fire: 'Fogo',
  frost: 'Gelo',
  bleed: 'Sangramento',
  stun: 'Atordoado',
  shield_up: 'CA+',
  shield_down: 'CA−',
  holy: 'Sagrado',
  shadow: 'Sombra',
  regen: 'Regeneração',
};

export const DAMAGE_MODE_LABELS: Record<DamageMode, string> = {
  None: 'Sem dano',
  Fixed: 'Dano fixo',
  DicePerTurn: 'Dado a cada turno',
  DiceOnce: 'Dado uma vez (repete)',
};

export const HEAL_MODE_LABELS: Record<DamageMode, string> = {
  None: 'Sem regeneração',
  Fixed: 'Cura fixa',
  DicePerTurn: 'Dado a cada turno',
  DiceOnce: 'Dado uma vez (repete)',
};

export function summarizeModifierEffect(m: {
  skipsTurn: boolean;
  acDelta: number;
  damageMode: DamageMode | string;
  damageAmount?: number | null;
  damageDice?: string | null;
  resolvedDamage?: number | null;
  healMode?: DamageMode | string;
  healAmount?: number | null;
  healDice?: string | null;
  resolvedHeal?: number | null;
}): string {
  const parts: string[] = [];
  if (m.skipsTurn) parts.push('pula turno');
  if (m.acDelta !== 0) parts.push(`CA ${m.acDelta > 0 ? '+' : ''}${m.acDelta}`);
  switch (m.damageMode) {
    case 'Fixed':
      if (m.damageAmount) parts.push(`${m.damageAmount} dano/turno`);
      break;
    case 'DicePerTurn':
      if (m.damageDice) parts.push(`${m.damageDice} dano/turno`);
      break;
    case 'DiceOnce':
      if (m.resolvedDamage != null) parts.push(`${m.resolvedDamage} dano/turno`);
      else if (m.damageDice) parts.push(`${m.damageDice} dano (1×)`);
      break;
  }
  switch (m.healMode) {
    case 'Fixed':
      if (m.healAmount) parts.push(`+${m.healAmount} vida/turno`);
      break;
    case 'DicePerTurn':
      if (m.healDice) parts.push(`+${m.healDice} vida/turno`);
      break;
    case 'DiceOnce':
      if (m.resolvedHeal != null) parts.push(`+${m.resolvedHeal} vida/turno`);
      else if (m.healDice) parts.push(`+${m.healDice} vida (1×)`);
      break;
  }
  return parts.join(' · ') || 'efeito visual';
}
