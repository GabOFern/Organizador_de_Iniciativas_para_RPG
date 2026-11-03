import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import {
  combatantViewNextLabel,
  combatantViewPageLabel,
  combatantViewPrevLabel,
  combatantViewSwipeThresholdPx,
} from '../config';
import {
  clampPage,
  pageCount,
  pageSlice,
  type CombatantViewMode,
} from '../combatantView';
import { CombatantViewToolbar } from './CombatantViewToolbar';

interface CombatantListViewProps<T extends { id: string }> {
  combatants: T[];
  mode: CombatantViewMode;
  itemsPerView: number;
  onModeChange: (mode: CombatantViewMode) => void;
  onItemsPerViewChange: (value: number) => void;
  renderCard: (combatant: T) => ReactNode;
}

export function CombatantListView<T extends { id: string }>({
  combatants,
  mode,
  itemsPerView,
  onModeChange,
  onItemsPerViewChange,
  renderCard,
}: CombatantListViewProps<T>) {
  const [page, setPage] = useState(1);
  const pointerStartX = useRef<number | null>(null);

  const totalPages = pageCount(combatants.length, itemsPerView);
  const currentPage = clampPage(page, combatants.length, itemsPerView);
  const visible =
    mode === 'carousel' ? pageSlice(combatants, currentPage, itemsPerView) : combatants;

  useEffect(() => {
    setPage((current) => clampPage(current, combatants.length, itemsPerView));
  }, [combatants.length, itemsPerView]);

  function goTo(next: number) {
    setPage(clampPage(next, combatants.length, itemsPerView));
  }

  function handleModeChange(next: CombatantViewMode) {
    if (next === 'carousel') setPage(1);
    onModeChange(next);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (mode !== 'carousel') return;
    pointerStartX.current = event.clientX;
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (mode !== 'carousel' || pointerStartX.current === null) return;
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
        onModeChange={handleModeChange}
        onItemsPerViewChange={onItemsPerViewChange}
      />

      {mode === 'carousel' ? (
        <div className="combatant-carousel">
          <button
            type="button"
            className="ghost combatant-carousel-nav"
            aria-label={combatantViewPrevLabel}
            disabled={currentPage <= 1}
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
            disabled={currentPage >= totalPages}
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
