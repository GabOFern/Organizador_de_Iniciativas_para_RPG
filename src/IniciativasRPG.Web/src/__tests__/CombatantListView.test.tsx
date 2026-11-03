import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { CombatantListView } from '../components/CombatantListView';
import {
  combatantViewCarouselLabel,
  combatantViewFocusFreeLabel,
  combatantViewFocusToggleAriaLabel,
  combatantViewFocusTurnLabel,
  combatantViewGridLabel,
  combatantViewNextLabel,
  combatantViewPageLabel,
  combatantViewPrevLabel,
  combatantViewPrefsStorageKey,
  combatantViewQuantityFieldLabel,
  combatantViewQuantityIncreaseLabel,
  combatantViewQuantityLabel,
} from '../config';
import type { CombatantFocusMode, CombatantViewMode } from '../combatantView';
import type { Combatant } from '../types';

function makeCombatant(index: number, turn = false): Combatant {
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
    isCurrentTurn: turn,
    hideHpFromPublic: false,
    modifiers: [],
  };
}

const eight = Array.from({ length: 8 }, (_, i) => makeCombatant(i + 1));

const noopFocus = () => {};

function renderList(
  props: Partial<{
    combatants: Combatant[];
    mode: CombatantViewMode;
    itemsPerView: number;
    focusMode: CombatantFocusMode;
    onModeChange: (mode: CombatantViewMode) => void;
    onItemsPerViewChange: (value: number) => void;
    onFocusModeChange: (mode: CombatantFocusMode) => void;
  }> = {},
) {
  return render(
    <CombatantListView
      combatants={props.combatants ?? eight}
      mode={props.mode ?? 'carousel'}
      itemsPerView={props.itemsPerView ?? 3}
      focusMode={props.focusMode ?? 'free'}
      onModeChange={props.onModeChange ?? (() => {})}
      onItemsPerViewChange={props.onItemsPerViewChange ?? (() => {})}
      onFocusModeChange={props.onFocusModeChange ?? noopFocus}
      renderCard={(c) => <span>{c.name}</span>}
    />,
  );
}

describe('CombatantListView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('fila_GradeComTresColunas_MostraTodasAsFichas', () => {
    const { container } = renderList({ mode: 'grid', itemsPerView: 3 });
    const track = screen.getByTestId('combatant-view-track');
    expect(track.className).toContain('combatant-grid--cols-3');
    expect(within(track).getAllByText(/Ficha /)).toHaveLength(8);
    expect(container.querySelector('[data-testid="combatant-view-page"]')).toBeNull();
  });

  it('fila_CarrosselTresPorPagina_AvancaEMostraIndicador', () => {
    renderList({ mode: 'carousel', itemsPerView: 3, focusMode: 'free' });
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(1, 3),
    );
    fireEvent.click(screen.getByRole('button', { name: combatantViewNextLabel }));
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(2, 3),
    );
    expect(screen.getByText('Ficha 4')).toBeTruthy();
  });

  it('fila_Carrossel_RemoverItens_ClampNaPagina', () => {
    const { rerender } = renderList({ mode: 'carousel', itemsPerView: 3 });
    fireEvent.click(screen.getByRole('button', { name: combatantViewNextLabel }));
    fireEvent.click(screen.getByRole('button', { name: combatantViewNextLabel }));
    rerender(
      <CombatantListView
        combatants={eight.slice(0, 3)}
        mode="carousel"
        itemsPerView={3}
        focusMode="free"
        onModeChange={() => {}}
        onItemsPerViewChange={() => {}}
        onFocusModeChange={noopFocus}
        renderCard={(c) => <span>{c.name}</span>}
      />,
    );
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(1, 1),
    );
  });

  it('fila_Carrossel_ReabreNaPaginaUm', () => {
    function Harness() {
      const [mode, setMode] = useState<CombatantViewMode>('carousel');
      return (
        <CombatantListView
          combatants={eight}
          mode={mode}
          itemsPerView={3}
          focusMode="free"
          onModeChange={setMode}
          onItemsPerViewChange={() => {}}
          onFocusModeChange={noopFocus}
          renderCard={(c) => <span>{c.name}</span>}
        />
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: combatantViewNextLabel }));
    fireEvent.click(screen.getByRole('button', { name: combatantViewGridLabel }));
    fireEvent.click(screen.getByRole('button', { name: combatantViewCarouselLabel }));
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(1, 3),
    );
  });

  it('fila_FocoSoNoCarrossel_NaoApareceNaGrade', () => {
    renderList({ mode: 'grid' });
    expect(screen.queryByRole('button', { name: combatantViewFocusToggleAriaLabel })).toBeNull();
  });

  it('fila_FocoTurno_VaiParaPaginaDoTurno', () => {
    const withTurn = eight.map((c, i) => ({ ...c, isCurrentTurn: i === 4 }));
    renderList({ mode: 'carousel', itemsPerView: 3, focusMode: 'turn', combatants: withTurn });
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(2, 3),
    );
    expect(screen.getByText('Ficha 5')).toBeTruthy();
    expect(screen.queryByText('Ficha 1')).toBeNull();
  });

  it('fila_FocoTurno_SetasDesligadas', () => {
    const withTurn = eight.map((c, i) => ({ ...c, isCurrentTurn: i === 0 }));
    renderList({ mode: 'carousel', itemsPerView: 3, focusMode: 'turn', combatants: withTurn });
    expect(
      (screen.getByRole('button', { name: combatantViewNextLabel }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole('button', { name: combatantViewPrevLabel }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('fila_FocoLivre_PermiteAvancar', () => {
    renderList({ mode: 'carousel', itemsPerView: 3, focusMode: 'free' });
    expect(
      (screen.getByRole('button', { name: combatantViewNextLabel }) as HTMLButtonElement).disabled,
    ).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: combatantViewNextLabel }));
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(2, 3),
    );
  });

  it('lista_FocoTurno_SemTurnoVivo_NaoMudaPagina', () => {
    const living = eight.map((c, i) => ({ ...c, isCurrentTurn: i === 4 }));
    const { rerender } = renderList({
      mode: 'carousel',
      itemsPerView: 3,
      focusMode: 'turn',
      combatants: living,
    });
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(2, 3),
    );
    const deadTurn = eight.map((c, i) => ({
      ...c,
      isCurrentTurn: i === 0,
      isDead: i === 0,
    }));
    rerender(
      <CombatantListView
        combatants={deadTurn}
        mode="carousel"
        itemsPerView={3}
        focusMode="turn"
        onModeChange={() => {}}
        onItemsPerViewChange={() => {}}
        onFocusModeChange={noopFocus}
        renderCard={(c) => <span>{c.name}</span>}
      />,
    );
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(2, 3),
    );
    expect(screen.getByText('Ficha 4')).toBeTruthy();
  });

  it('lista_EntrarNoCarrosselComFocoTurno_AbreNaPaginaDoTurno', () => {
    const withTurn = eight.map((c, i) => ({ ...c, isCurrentTurn: i === 4 }));
    function Harness() {
      const [mode, setMode] = useState<CombatantViewMode>('grid');
      return (
        <CombatantListView
          combatants={withTurn}
          mode={mode}
          itemsPerView={3}
          focusMode="turn"
          onModeChange={setMode}
          onItemsPerViewChange={() => {}}
          onFocusModeChange={noopFocus}
          renderCard={(c) => <span>{c.name}</span>}
        />
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: combatantViewCarouselLabel }));
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(2, 3),
    );
    expect(screen.getByText('Ficha 5')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: combatantViewCarouselLabel }));
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(2, 3),
    );
  });

  it('lista_AtivarFocoTurno_SaltaParaPaginaDoTurno', () => {
    function Harness() {
      const [focusMode, setFocusMode] = useState<CombatantFocusMode>('free');
      const withTurn = eight.map((c, i) => ({ ...c, isCurrentTurn: i === 5 }));
      return (
        <CombatantListView
          combatants={withTurn}
          mode="carousel"
          itemsPerView={3}
          focusMode={focusMode}
          onModeChange={() => {}}
          onItemsPerViewChange={() => {}}
          onFocusModeChange={setFocusMode}
          renderCard={(c) => <span>{c.name}</span>}
        />
      );
    }
    render(<Harness />);
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(1, 3),
    );
    fireEvent.click(screen.getByRole('button', { name: combatantViewFocusToggleAriaLabel }));
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(2, 3),
    );
    expect(screen.getByText('Ficha 6')).toBeTruthy();
  });

  it('lista_FocoTurno_SnapshotNovoTurno_AcompanhaPagina', () => {
    const page1Turn = eight.map((c, i) => ({ ...c, isCurrentTurn: i === 0 }));
    const { rerender } = renderList({
      mode: 'carousel',
      itemsPerView: 3,
      focusMode: 'turn',
      combatants: page1Turn,
    });
    const page3Turn = eight.map((c, i) => ({ ...c, isCurrentTurn: i === 7 }));
    rerender(
      <CombatantListView
        combatants={page3Turn}
        mode="carousel"
        itemsPerView={3}
        focusMode="turn"
        onModeChange={() => {}}
        onItemsPerViewChange={() => {}}
        onFocusModeChange={noopFocus}
        renderCard={(c) => <span>{c.name}</span>}
      />,
    );
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(3, 3),
    );
    expect(screen.getByText('Ficha 8')).toBeTruthy();
  });

  it('lista_FocoTurno_MudarQuantidade_RecalculaPagina', () => {
    const withTurn = eight.map((c, i) => ({ ...c, isCurrentTurn: i === 5 }));
    const { rerender } = renderList({
      mode: 'carousel',
      itemsPerView: 3,
      focusMode: 'turn',
      combatants: withTurn,
    });
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(2, 3),
    );
    rerender(
      <CombatantListView
        combatants={withTurn}
        mode="carousel"
        itemsPerView={2}
        focusMode="turn"
        onModeChange={() => {}}
        onItemsPerViewChange={() => {}}
        onFocusModeChange={noopFocus}
        renderCard={(c) => <span>{c.name}</span>}
      />,
    );
    expect(screen.getByTestId('combatant-view-page').textContent).toBe(
      combatantViewPageLabel(3, 4),
    );
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
      const { prefs, setMode, setItemsPerView, setFocusMode } = useCombatantViewPrefs();
      return (
        <CombatantListView
          combatants={eight.slice(0, 2)}
          mode={prefs.mode}
          itemsPerView={prefs.itemsPerView}
          focusMode={prefs.focusMode}
          onModeChange={setMode}
          onItemsPerViewChange={setItemsPerView}
          onFocusModeChange={setFocusMode}
          renderCard={(c) => <span>{c.name}</span>}
        />
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: combatantViewCarouselLabel }));
    expect(JSON.parse(localStorage.getItem(combatantViewPrefsStorageKey)!).mode).toBe('carousel');
  });

  it('fila_TrocarFoco_PersisteNoStorage', async () => {
    const { useCombatantViewPrefs } = await import('../hooks/useCombatantViewPrefs');
    function Harness() {
      const { prefs, setMode, setItemsPerView, setFocusMode } = useCombatantViewPrefs();
      return (
        <CombatantListView
          combatants={eight}
          mode={prefs.mode === 'grid' ? 'carousel' : prefs.mode}
          itemsPerView={prefs.itemsPerView}
          focusMode={prefs.focusMode}
          onModeChange={setMode}
          onItemsPerViewChange={setItemsPerView}
          onFocusModeChange={setFocusMode}
          renderCard={(c) => <span>{c.name}</span>}
        />
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: combatantViewCarouselLabel }));
    fireEvent.click(screen.getByRole('button', { name: combatantViewFocusToggleAriaLabel }));
    expect(screen.getByRole('button', { name: combatantViewFocusToggleAriaLabel }).textContent).toBe(
      combatantViewFocusTurnLabel,
    );
    expect(JSON.parse(localStorage.getItem(combatantViewPrefsStorageKey)!).focusMode).toBe('turn');
    fireEvent.click(screen.getByRole('button', { name: combatantViewFocusToggleAriaLabel }));
    expect(screen.getByRole('button', { name: combatantViewFocusToggleAriaLabel }).textContent).toBe(
      combatantViewFocusFreeLabel,
    );
  });

  it('fila_Quantidade_AlteraItemsPerView', () => {
    const onItemsPerViewChange = vi.fn();
    renderList({
      mode: 'grid',
      itemsPerView: 2,
      onItemsPerViewChange,
    });
    fireEvent.click(screen.getByRole('button', { name: combatantViewQuantityLabel }));
    fireEvent.click(screen.getByRole('button', { name: combatantViewQuantityIncreaseLabel() }));
    expect(onItemsPerViewChange).toHaveBeenCalledWith(3);
    expect(
      (screen.getByRole('spinbutton', { name: combatantViewQuantityFieldLabel }) as HTMLInputElement)
        .value,
    ).toBe('3');
  });
});
