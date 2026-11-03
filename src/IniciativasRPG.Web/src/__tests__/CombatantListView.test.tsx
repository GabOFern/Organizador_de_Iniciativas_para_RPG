import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { CombatantListView } from '../components/CombatantListView';
import {
  combatantViewCarouselLabel,
  combatantViewGridLabel,
  combatantViewNextLabel,
  combatantViewPageLabel,
  combatantViewPrefsStorageKey,
  combatantViewQuantityFieldLabel,
  combatantViewQuantityIncreaseLabel,
  combatantViewQuantityLabel,
} from '../config';
import type { Combatant } from '../types';

function makeCombatant(index: number): Combatant {
  return {
    id: `c${index}`,
    sheetId: `s${index}`,
    name: `Ficha ${index}`,
    imageUrl: null,
    imageFocusX: 50,
    imageFocusY: 50,
    imageScale: 1,
    sheetType: 'Creature',
    initiative: index,
    currentHp: 10,
    maxHp: 10,
    currentAc: 12,
    isDead: false,
    sortOrder: index,
    isCurrentTurn: false,
    hideHpFromPublic: false,
    modifiers: [],
  };
}

const eight = Array.from({ length: 8 }, (_, i) => makeCombatant(i + 1));

describe('CombatantListView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('fila_GradeComTresColunas_MostraTodasAsFichas', () => {
    const { container } = render(
      <CombatantListView
        combatants={eight}
        mode="grid"
        itemsPerView={3}
        onModeChange={() => {}}
        onItemsPerViewChange={() => {}}
        renderCard={(c) => <span>{c.name}</span>}
      />,
    );

    const track = screen.getByTestId('combatant-view-track');
    expect(track.className).toContain('combatant-grid--cols-3');
    expect(within(track).getAllByText(/Ficha /)).toHaveLength(8);
    expect(container.querySelector('[data-testid="combatant-view-page"]')).toBeNull();
  });

  it('fila_CarrosselTresPorPagina_AvancaEMostraIndicador', () => {
    render(
      <CombatantListView
        combatants={eight}
        mode="carousel"
        itemsPerView={3}
        onModeChange={() => {}}
        onItemsPerViewChange={() => {}}
        renderCard={(c) => <span>{c.name}</span>}
      />,
    );

    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(1, 3),
    );
    expect(screen.getByText('Ficha 1')).toBeTruthy();
    expect(screen.getByText('Ficha 3')).toBeTruthy();
    expect(screen.queryByText('Ficha 4')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: combatantViewNextLabel }));

    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(2, 3),
    );
    expect(screen.getByText('Ficha 4')).toBeTruthy();
    expect(screen.queryByText('Ficha 1')).toBeNull();
  });

  it('fila_Carrossel_RemoverItens_ClampNaPagina', () => {
    const { rerender } = render(
      <CombatantListView
        combatants={eight}
        mode="carousel"
        itemsPerView={3}
        onModeChange={() => {}}
        onItemsPerViewChange={() => {}}
        renderCard={(c) => <span>{c.name}</span>}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: combatantViewNextLabel }));
    fireEvent.click(screen.getByRole('button', { name: combatantViewNextLabel }));
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(3, 3),
    );

    rerender(
      <CombatantListView
        combatants={eight.slice(0, 3)}
        mode="carousel"
        itemsPerView={3}
        onModeChange={() => {}}
        onItemsPerViewChange={() => {}}
        renderCard={(c) => <span>{c.name}</span>}
      />,
    );

    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(1, 1),
    );
    expect(screen.getByText('Ficha 1')).toBeTruthy();
  });

  it('fila_Carrossel_ReabreNaPaginaUm', () => {
    function Harness() {
      const [mode, setMode] = useState<'grid' | 'carousel'>('carousel');
      return (
        <CombatantListView
          combatants={eight}
          mode={mode}
          itemsPerView={3}
          onModeChange={setMode}
          onItemsPerViewChange={() => {}}
          renderCard={(c) => <span>{c.name}</span>}
        />
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: combatantViewNextLabel }));
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(2, 3),
    );

    fireEvent.click(screen.getByRole('button', { name: combatantViewGridLabel }));
    fireEvent.click(screen.getByRole('button', { name: combatantViewCarouselLabel }));

    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(1, 3),
    );
    expect(screen.getByText('Ficha 1')).toBeTruthy();
    expect(screen.queryByText('Ficha 4')).toBeNull();
  });
});

describe('CombatantViewToolbar prefs', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('fila_TrocarModo_PersisteNoStorage', async () => {
    const { useCombatantViewPrefs } = await import('../hooks/useCombatantViewPrefs');
    function Harness() {
      const { prefs, setMode, setItemsPerView } = useCombatantViewPrefs();
      return (
        <CombatantListView
          combatants={eight.slice(0, 2)}
          mode={prefs.mode}
          itemsPerView={prefs.itemsPerView}
          onModeChange={setMode}
          onItemsPerViewChange={setItemsPerView}
          renderCard={(c) => <span>{c.name}</span>}
        />
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: combatantViewCarouselLabel }));
    const raw = localStorage.getItem(combatantViewPrefsStorageKey);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).mode).toBe('carousel');
    expect(screen.getByRole('button', { name: combatantViewCarouselLabel }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: combatantViewGridLabel }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('fila_Quantidade_AlteraItemsPerView', async () => {
    const onItemsPerViewChange = vi.fn();
    render(
      <CombatantListView
        combatants={eight}
        mode="grid"
        itemsPerView={2}
        onModeChange={() => {}}
        onItemsPerViewChange={onItemsPerViewChange}
        renderCard={(c) => <span>{c.name}</span>}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: combatantViewQuantityLabel }));
    fireEvent.click(screen.getByRole('button', { name: combatantViewQuantityIncreaseLabel() }));
    expect(onItemsPerViewChange).toHaveBeenCalledWith(3);
    expect(
      (screen.getByRole('spinbutton', { name: combatantViewQuantityFieldLabel }) as HTMLInputElement)
        .value,
    ).toBe('3');
  });
});
