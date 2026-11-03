import { cleanup, render, screen } from '@testing-library/react';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
import { afterEach, describe, expect, it } from 'vitest';
import { CombatantCard } from '../components/CombatantCard';
import { ThemeProvider } from '../theme';
import type { Combatant } from '../types';

function combatant(): Combatant {
  return {
    id: 'c1',
    sheetId: 's1',
    name: 'Goblin',
    imageUrl: '/sheets/goblin.png',
    imageFocusX: 50,
    imageFocusY: 50,
    imageScale: 1,
    sheetType: 'Creature',
    initiative: 12,
    currentHp: 8,
    maxHp: 10,
    currentAc: 13,
    isDead: false,
    sortOrder: 0,
    isCurrentTurn: false,
    hideHpFromPublic: false,
    modifiers: [],
  };
}

function renderCard(readOnly: boolean) {
  return render(
    <ThemeProvider>
      <CombatantCard combatant={combatant()} readOnly={readOnly} />
    </ThemeProvider>,
  );
}

describe('CombatantCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('readOnly_Imagem_UsaLazyEAsync', () => {
    renderCard(true);
    const img = screen.getByRole('img', { name: 'Goblin' });
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
  });

  it('edicao_Imagem_NaoForcaLazy', () => {
    renderCard(false);
    const img = screen.getByRole('img', { name: 'Goblin' });
    expect(img.getAttribute('loading')).toBeNull();
    expect(img.getAttribute('decoding')).toBeNull();
  });
});
