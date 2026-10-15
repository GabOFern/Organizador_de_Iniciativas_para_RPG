import { describe, it, expect } from 'vitest';
import {
  formatModifier,
  attackHitBonus,
  abilityModifierOf,
  formatAttackHit,
  sheetFeatureTextLimit,
  sheetFeatureTextMaxLength,
  sheetAnnotationTextMaxLength,
} from '../config';

describe('formatModifier', () => {
  it('positivo inclui +', () => {
    expect(formatModifier(3)).toBe('+3');
  });

  it('zero inclui +', () => {
    expect(formatModifier(0)).toBe('+0');
  });

  it('negativo mostra -', () => {
    expect(formatModifier(-2)).toBe('-2');
  });
});

describe('attackHitBonus', () => {
  it('soma proficiência + modificador', () => {
    expect(attackHitBonus(2, 3)).toBe(5);
  });

  it('funciona com modificador negativo', () => {
    expect(attackHitBonus(2, -1)).toBe(1);
  });
});

describe('abilityModifierOf', () => {
  const mods = {
    strengthMod: 1,
    dexterityMod: 2,
    constitutionMod: 3,
    intelligenceMod: -1,
    wisdomMod: 0,
    charismaMod: -2,
  };

  it('retorna strengthMod como default', () => {
    expect(abilityModifierOf('Strength', mods)).toBe(1);
    expect(abilityModifierOf('Unknown', mods)).toBe(1);
  });

  it('retorna cada atributo correto', () => {
    expect(abilityModifierOf('Dexterity', mods)).toBe(2);
    expect(abilityModifierOf('Constitution', mods)).toBe(3);
    expect(abilityModifierOf('Intelligence', mods)).toBe(-1);
    expect(abilityModifierOf('Wisdom', mods)).toBe(0);
    expect(abilityModifierOf('Charisma', mods)).toBe(-2);
  });
});

describe('formatAttackHit', () => {
  it('monta string com label, modificador e acerto', () => {
    const mods = {
      strengthMod: 3,
      dexterityMod: 2,
      constitutionMod: 0,
      intelligenceMod: 0,
      wisdomMod: 0,
      charismaMod: 0,
    };
    const result = formatAttackHit('Strength', mods, 2);
    expect(result).toBe('Força +3 · acerto +5');
  });
});

describe('sheetFeatureTextLimit', () => {
  it('Annotation retorna limite maior', () => {
    expect(sheetFeatureTextLimit('Annotation')).toBe(sheetAnnotationTextMaxLength);
  });

  it('Trait retorna limite padrão', () => {
    expect(sheetFeatureTextLimit('Trait')).toBe(sheetFeatureTextMaxLength);
  });

  it('Note retorna limite padrão', () => {
    expect(sheetFeatureTextLimit('Note')).toBe(sheetFeatureTextMaxLength);
  });
});
