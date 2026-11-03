import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import {
  combatantViewNextLabel,
  combatantViewPageLabel,
  combatantViewPrevLabel,
  combatantViewSwipeThresholdPx,
} from '../config';
import {
  clampPage,
  findCurrentTurnIndex,
  pageCount,
  pageForCombatantIndex,
  pageSlice,
  type CombatantFocusMode,
  type CombatantViewMode,
} from '../combatantView';
import { CombatantViewToolbar } from './CombatantViewToolbar';

interface CombatantListViewProps<T extends { id: string; isCurrentTurn: boolean; isDead: boolean }> {
  combatants: T[];
  mode: CombatantViewMode;
  itemsPerView: number;
  focusMode: CombatantFocusMode;
  onModeChange: (mode: CombatantViewMode) => void;
  onItemsPerViewChange: (value: number) => void;
  onFocusModeChange: (mode: CombatantFocusMode) => void;
  renderCard: (combatant: T) => ReactNode;
}

export function CombatantListView<T extends { id: string; isCurrentTurn: boolean; isDead: boolean }>({
  combatants,
  mode,
  itemsPerView,
  focusMode,
  onModeChange,
  onItemsPerViewChange,
  onFocusModeChange,
  renderCard,
}: CombatantListViewProps<T>) {
  const [page, setPage] = useState(1);
  const pointerStartX = useRef<number | null>(null);
  const turnLocked = mode === 'carousel' && focusMode === 'turn';

  const totalPages = pageCount(combatants.length, itemsPerView);
  const currentPage = clampPage(page, combatants.length, itemsPerView);
  const visible =
    mode === 'carousel' ? pageSlice(combatants, currentPage, itemsPerView) : combatants;

  useEffect(() => {
    setPage((current) => clampPage(current, combatants.length, itemsPerView));
  }, [combatants.length, itemsPerView]);

  useEffect(() => {
    if (!turnLocked) return;
    const turnIndex = findCurrentTurnIndex(combatants);
    if (turnIndex < 0) return;
    setPage(
      clampPage(pageForCombatantIndex(turnIndex, itemsPerView), combatants.length, itemsPerView),
    );
  }, [turnLocked, combatants, itemsPerView]);

  function goTo(next: number) {
    if (turnLocked) return;
    setPage(clampPage(next, combatants.length, itemsPerView));
  }

  function handleModeChange(next: CombatantViewMode) {
    if (next === 'carousel' && mode !== 'carousel') {
      const turnIndex = focusMode === 'turn' ? findCurrentTurnIndex(combatants) : -1;
      setPage(
        turnIndex >= 0
          ? clampPage(pageForCombatantIndex(turnIndex, itemsPerView), combatants.length, itemsPerView)
          : 1,
      );
    }
    onModeChange(next);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (mode !== 'carousel' || turnLocked) return;
    pointerStartX.current = event.clientX;
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (mode !== 'carousel' || turnLocked || pointerStartX.current === null) return;
    const delta = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(delta) < combatantViewSwipeThresholdPx) return;
    if (delta < 0) goTo(currentPage + 1);
    else goTo(currentPage - 1);
  }

  return (
    <div className="combatant-list-view">
      <CombatantViewToolbar
        mode={mode}
        itemsPerView={itemsPerView}
        focusMode={focusMode}
        onModeChange={handleModeChange}
        onItemsPerViewChange={onItemsPerViewChange}
        onFocusModeChange={onFocusModeChange}
      />

      {mode === 'carousel' ? (
        <div className="combatant-carousel">
          <button
            type="button"
            className="ghost combatant-carousel-nav"
            aria-label={combatantViewPrevLabel}
            disabled={turnLocked || currentPage <= 1}
            onClick={() => goTo(currentPage - 1)}
          >
            {'<'}
          </button>
          <div
            className={`combatant-grid combatant-grid--cols-${itemsPerView}`}
            data-testid="combatant-view-track"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              pointerStartX.current = null;
            }}
          >
            {visible.map((combatant) => (
              <div key={combatant.id}>{renderCard(combatant)}</div>
            ))}
          </div>
          <button
            type="button"
            className="ghost combatant-carousel-nav"
            aria-label={combatantViewNextLabel}
            disabled={turnLocked || currentPage >= totalPages}
            onClick={() => goTo(currentPage + 1)}
          >
            {'>'}
          </button>
          <p className="combatant-carousel-page muted" data-testid="combatant-view-page">
            {combatantViewPageLabel(currentPage, totalPages)}
          </p>
        </div>
      ) : (
        <div
          className={`combatant-grid combatant-grid--cols-${itemsPerView}`}
          data-testid="combatant-view-track"
        >
          {visible.map((combatant) => (
            <div key={combatant.id}>{renderCard(combatant)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
