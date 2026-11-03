import { useEffect, useId, useState } from 'react';
import {
  combatantViewCarouselLabel,
  combatantViewFocusFreeLabel,
  combatantViewFocusToggleAriaLabel,
  combatantViewFocusTurnLabel,
  combatantViewGridLabel,
  combatantViewMaxItems,
  combatantViewMinItems,
  combatantViewQuantityDecreaseLabel,
  combatantViewQuantityDialogTitle,
  combatantViewQuantityFieldLabel,
  combatantViewQuantityIncreaseLabel,
  combatantViewQuantityLabel,
} from '../config';
import {
  clampItemsPerView,
  type CombatantFocusMode,
  type CombatantViewMode,
} from '../combatantView';

interface CombatantViewToolbarProps {
  mode: CombatantViewMode;
  itemsPerView: number;
  focusMode: CombatantFocusMode;
  onModeChange: (mode: CombatantViewMode) => void;
  onItemsPerViewChange: (value: number) => void;
  onFocusModeChange: (mode: CombatantFocusMode) => void;
}

export function CombatantViewToolbar({
  mode,
  itemsPerView,
  focusMode,
  onModeChange,
  onItemsPerViewChange,
  onFocusModeChange,
}: CombatantViewToolbarProps) {
  const titleId = useId();
  const [quantityOpen, setQuantityOpen] = useState(false);
  const [draft, setDraft] = useState(itemsPerView);

  useEffect(() => {
    if (!quantityOpen) return;
    setDraft(itemsPerView);
  }, [quantityOpen, itemsPerView]);

  useEffect(() => {
    if (!quantityOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setQuantityOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [quantityOpen]);

  function applyDraft(value: number) {
    const next = clampItemsPerView(value);
    setDraft(next);
    onItemsPerViewChange(next);
  }

  function toggleFocus() {
    onFocusModeChange(focusMode === 'turn' ? 'free' : 'turn');
  }

  return (
    <div className="combatant-view-toolbar" role="group" aria-label="Visualização da fila">
      <button
        type="button"
        className={mode === 'grid' ? 'primary' : 'ghost'}
        aria-pressed={mode === 'grid'}
        onClick={() => onModeChange('grid')}
      >
        {combatantViewGridLabel}
      </button>
      <button
        type="button"
        className={mode === 'carousel' ? 'primary' : 'ghost'}
        aria-pressed={mode === 'carousel'}
        onClick={() => onModeChange('carousel')}
      >
        {combatantViewCarouselLabel}
      </button>
      {mode === 'carousel' && (
        <button
          type="button"
          className={focusMode === 'turn' ? 'primary' : 'ghost'}
          aria-pressed={focusMode === 'turn'}
          aria-label={combatantViewFocusToggleAriaLabel}
          onClick={toggleFocus}
        >
          {focusMode === 'turn' ? combatantViewFocusTurnLabel : combatantViewFocusFreeLabel}
        </button>
      )}
      <button type="button" className="ghost" onClick={() => setQuantityOpen(true)}>
        {combatantViewQuantityLabel}
      </button>

      {quantityOpen && (
        <div className="modal-backdrop" onClick={() => setQuantityOpen(false)}>
          <div
            className="modal-panel panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={titleId}>{combatantViewQuantityDialogTitle}</h2>
            <div className="combatant-view-qty-field">
              <span id={`${titleId}-qty`}>{combatantViewQuantityFieldLabel}</span>
              <div className="lineup-qty">
                <button
                  type="button"
                  aria-label={combatantViewQuantityDecreaseLabel()}
                  disabled={draft <= combatantViewMinItems}
                  onClick={() => applyDraft(draft - 1)}
                >
                  {'<'}
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={combatantViewMinItems}
                  max={combatantViewMaxItems}
                  value={draft}
                  aria-labelledby={`${titleId}-qty`}
                  onChange={(event) => applyDraft(Number(event.target.value))}
                />
                <button
                  type="button"
                  aria-label={combatantViewQuantityIncreaseLabel()}
                  disabled={draft >= combatantViewMaxItems}
                  onClick={() => applyDraft(draft + 1)}
                >
                  {'>'}
                </button>
              </div>
            </div>
            <div className="row">
              <button type="button" className="ghost" onClick={() => setQuantityOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
