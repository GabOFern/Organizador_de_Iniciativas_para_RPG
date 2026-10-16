import { useEffect, useId, useState } from 'react';
import { api, ApiError } from '../api';
import {
  lineupBackLabel,
  lineupConfirmLabel,
  lineupInitiativeLabel,
  lineupNoScenesInvoke,
  lineupRollLabel,
  invokeLineupLabel,
} from '../config';
import { lineupInitiativeNotation, lineupRowsReady } from '../lineupInvoke';
import { expandLineupInvokeRows } from '../lineupQuantity';
import type { InvokeLineupPayload, Lineup } from '../types';

interface InvokeSceneModalProps {
  open: boolean;
  onClose: () => void;
  onInvoke: (payload: InvokeLineupPayload) => Promise<void>;
}

interface RowState {
  sheetId: string;
  name: string;
  bonus: number;
  initiative: string;
  roll: boolean;
}

export function InvokeSceneModal({ open, onClose, onInvoke }: InvokeSceneModalProps) {
  const titleId = useId();
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [selected, setSelected] = useState<Lineup | null>(null);
  const [rows, setRows] = useState<RowState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setRows([]);
    setError(null);
    setBusy(false);
    void api
      .listLineups()
      .then(setLineups)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Falha ao carregar cenas.'));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function choose(lineup: Lineup) {
    setSelected(lineup);
    setRows(
      expandLineupInvokeRows(lineup.members).map((member) => ({
        sheetId: member.sheetId,
        name: member.name,
        bonus: member.bonus,
        initiative: '',
        roll: false,
      })),
    );
    setError(null);
  }

  function updateRow(index: number, patch: Partial<RowState>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  async function confirm() {
    if (!selected || !lineupRowsReady(rows)) return;
    setBusy(true);
    setError(null);
    try {
      await onInvoke({
        lineupId: selected.id,
        members: rows.map((row) => ({
          sheetId: row.sheetId,
          rollDice: row.roll,
          initiative: row.roll ? null : Number(row.initiative),
        })),
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao invocar a cena.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id={titleId}>{selected ? selected.name : invokeLineupLabel}</h2>
          <button type="button" className="ghost" onClick={onClose} aria-label="Fechar">
            Fechar
          </button>
        </header>
        {error && <p className="error">{error}</p>}
        {!selected ? (
          lineups.length === 0 && !error ? (
            <p>{lineupNoScenesInvoke}</p>
          ) : (
            <ul className="lineup-picker">
              {lineups.map((lineup) => (
                <li key={lineup.id}>
                  <button type="button" onClick={() => choose(lineup)}>
                    {lineup.name}
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <>
            <ul className="lineup-initiatives">
              {rows.map((row, index) => (
                <li key={`${row.sheetId}-${index}`}>
                  <span>{row.name}</span>
                  <label>
                    {lineupInitiativeLabel}
                    <input
                      inputMode="numeric"
                      value={row.initiative}
                      disabled={row.roll || busy}
                      onChange={(event) => updateRow(index, { initiative: event.target.value })}
                    />
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={row.roll}
                      disabled={busy}
                      onChange={(event) => updateRow(index, { roll: event.target.checked })}
                    />
                    {lineupRollLabel}
                    {row.roll ? ` (${lineupInitiativeNotation(row.bonus)})` : ''}
                  </label>
                </li>
              ))}
            </ul>
            <div className="modal-actions">
              <button type="button" className="ghost" disabled={busy} onClick={() => setSelected(null)}>
                {lineupBackLabel}
              </button>
              <button type="button" disabled={busy || !lineupRowsReady(rows)} onClick={() => void confirm()}>
                {lineupConfirmLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
