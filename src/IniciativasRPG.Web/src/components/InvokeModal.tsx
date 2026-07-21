import { useEffect, useId, useState, type FormEvent } from 'react';
import type { Sheet, SheetType } from '../types';

export interface InvokePayload {
  type: SheetType;
  sheetId: string;
  initiative: number;
  rollDice: boolean;
  diceNotation: string;
  hideHpFromPublic: boolean;
}

interface InvokeModalProps {
  open: boolean;
  sheets: Sheet[];
  onClose: () => void;
  onInvoke: (payload: InvokePayload) => Promise<void>;
}

function isNonPlayer(type: SheetType) {
  return type === 'Creature' || type === 'Npc';
}

export function InvokeModal({ open, sheets, onClose, onInvoke }: InvokeModalProps) {
  const titleId = useId();
  const [type, setType] = useState<SheetType>('Player');
  const [sheetId, setSheetId] = useState('');
  const [initiative, setInitiative] = useState(10);
  const [rollDice, setRollDice] = useState(false);
  const [diceNotation, setDiceNotation] = useState('1d20');
  const [hideHpFromPublic, setHideHpFromPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const options = sheets.filter((s) => s.type === type);

  useEffect(() => {
    if (!open) return;

    setLocalError(null);
    setSubmitting(false);
    setType('Player');
    setInitiative(10);
    setRollDice(false);
    setDiceNotation('1d20');
    setHideHpFromPublic(true);

    const players = sheets.filter((s) => s.type === 'Player');
    setSheetId(players[0]?.id ?? '');
  }, [open, sheets]);

  useEffect(() => {
    if (!open) return;
    const filtered = sheets.filter((s) => s.type === type);
    const first = filtered[0];
    if (!first) {
      setSheetId('');
      return;
    }
    setSheetId((current) => (filtered.some((s) => s.id === current) ? current : first.id));
  }, [type, open, sheets]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!sheetId) {
      setLocalError('Selecione uma ficha.');
      return;
    }

    setSubmitting(true);
    setLocalError(null);
    try {
      await onInvoke({
        type,
        sheetId,
        initiative,
        rollDice: isNonPlayer(type) && rollDice,
        diceNotation,
        hideHpFromPublic: isNonPlayer(type) ? hideHpFromPublic : false,
      });
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Falha ao invocar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-panel panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id={titleId}>Invocar combatente</h2>
          <button type="button" className="ghost" onClick={onClose} aria-label="Fechar">
            Fechar
          </button>
        </header>

        <form className="stack" onSubmit={(e) => void onSubmit(e)}>
          <fieldset className="type-toggle">
            <legend className="sr-only">Tipo de ficha</legend>
            <label className={type === 'Player' ? 'is-active' : ''}>
              <input
                type="radio"
                name="sheetType"
                checked={type === 'Player'}
                onChange={() => setType('Player')}
              />
              Player
            </label>
            <label className={type === 'Creature' ? 'is-active' : ''}>
              <input
                type="radio"
                name="sheetType"
                checked={type === 'Creature'}
                onChange={() => setType('Creature')}
              />
              Criatura
            </label>
            <label className={type === 'Npc' ? 'is-active' : ''}>
              <input
                type="radio"
                name="sheetType"
                checked={type === 'Npc'}
                onChange={() => setType('Npc')}
              />
              NPC
            </label>
          </fieldset>

          <label>
            Ficha
            <select
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
              required
              disabled={options.length === 0}
            >
              {options.length === 0 ? (
                <option value="">Nenhuma ficha deste tipo</option>
              ) : (
                options.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
          </label>

          {isNonPlayer(type) && (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={rollDice}
                onChange={(e) => setRollDice(e.target.checked)}
              />
              Rolar dado
            </label>
          )}

          {isNonPlayer(type) && rollDice ? (
            <label>
              Notação
              <input
                value={diceNotation}
                onChange={(e) => setDiceNotation(e.target.value)}
                placeholder="1d20+2"
                required
              />
            </label>
          ) : (
            <label>
              Iniciativa
              <input
                type="number"
                value={initiative}
                onChange={(e) => setInitiative(Number(e.target.value))}
                required
              />
            </label>
          )}

          {isNonPlayer(type) && (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={hideHpFromPublic}
                onChange={(e) => setHideHpFromPublic(e.target.checked)}
              />
              Ocultar vida no link público
            </label>
          )}

          {localError && <p className="error">{localError}</p>}

          <div className="row modal-actions">
            <button type="button" className="ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting || options.length === 0}>
              {submitting ? 'Invocando…' : 'Invocar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
