import { useEffect, useId, useState } from 'react';
import { invokeLineupLabel, invokeOptionsLabel, invokeSheetLabel } from '../config';

interface InvokeSplitProps {
  disabled?: boolean;
  onInvokeSheet: () => void;
  onInvokeScene: () => void;
}

export function InvokeSplit({ disabled, onInvokeSheet, onInvokeScene }: InvokeSplitProps) {
  const menuId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function choose(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="invoke-split">
      <button type="button" disabled={disabled} onClick={onInvokeSheet}>
        Invocar
      </button>
      <button
        type="button"
        className="invoke-split-arrow"
        disabled={disabled}
        aria-label={invokeOptionsLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        ▼
      </button>
      {open && (
        <div id={menuId} className="invoke-menu panel" role="menu">
          <button type="button" role="menuitem" onClick={() => choose(onInvokeSheet)}>
            {invokeSheetLabel}
          </button>
          <button type="button" role="menuitem" onClick={() => choose(onInvokeScene)}>
            {invokeLineupLabel}
          </button>
        </div>
      )}
    </div>
  );
}
