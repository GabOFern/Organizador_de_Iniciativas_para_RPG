import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import {
  lineupCancelLabel,
  lineupDeleteConfirm,
  lineupDeleteLabel,
  lineupEditHeading,
  lineupEditLabel,
  lineupEmptyMessage,
  lineupIncludeLabel,
  lineupNameLabel,
  lineupNameRequired,
  lineupNeedsMembers,
  lineupNewHeading,
  lineupSaveLabel,
  lineupQuantityDecreaseLabel,
  lineupQuantityFieldLabel,
  lineupQuantityIncreaseLabel,
  lineupSheetsLabel,
  resolveApiUrl,
  sheetFilterAllCategoriesLabel,
  sheetFilterCategoryLabel,
  sheetFilterEmptyMessage,
  sheetFilterNameLabel,
  sheetRepositoryEmptyMessage,
  sheetTypeLabels,
} from '../config';
import { clampLineupQuantity, formatLineupMemberSummary, lineupQuantityMax } from '../lineupQuantity';
import { filterSheets, type SheetCategoryFilter } from '../sheetFilters';
import type { Lineup, Sheet } from '../types';

export function ScenesPage() {
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [nameQuery, setNameQuery] = useState('');
  const [category, setCategory] = useState<SheetCategoryFilter>('all');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [nextLineups, nextSheets] = await Promise.all([api.listLineups(), api.listSheets()]);
    setLineups(nextLineups);
    setSheets(nextSheets);
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar cenas.'),
    );
  }, []);

  function resetForm() {
    setEditingId(null);
    setName('');
    setQuantities({});
  }

  function startEdit(lineup: Lineup) {
    setEditingId(lineup.id);
    setName(lineup.name);
    setQuantities(Object.fromEntries(lineup.members.map((member) => [member.sheetId, member.quantity])));
    setError(null);
  }

  function setQuantity(id: string, type: string, value: number) {
    setQuantities((current) => ({ ...current, [id]: clampLineupQuantity(value, type) }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(lineupNameRequired);
      return;
    }
    const members = sheets
      .map((sheet) => ({ sheetId: sheet.id, quantity: quantities[sheet.id] ?? 0 }))
      .filter((member) => member.quantity > 0);
    if (members.length === 0) {
      setError(lineupNeedsMembers);
      return;
    }

    setError(null);
    const payload = { name: trimmed, members };
    try {
      if (editingId) {
        await api.updateLineup(editingId, payload);
      } else {
        await api.createLineup(payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao gravar a cena.');
    }
  }

  async function remove(lineup: Lineup) {
    if (!window.confirm(lineupDeleteConfirm)) return;
    setError(null);
    try {
      await api.deleteLineup(lineup.id);
      if (editingId === lineup.id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao excluir a cena.');
    }
  }

  const visibleSheets = filterSheets(sheets, { nameQuery, category });

  return (
    <div className="stack">
      <section className="panel">
        <h2>{editingId ? lineupEditHeading : lineupNewHeading}</h2>
        {error && <p className="error">{error}</p>}
        <form className="lineup-form" onSubmit={(event) => void onSubmit(event)}>
          <label>
            {lineupNameLabel}
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <div className="sheet-filters">
            <label>
              {sheetFilterNameLabel}
              <input value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} />
            </label>
            <label>
              {sheetFilterCategoryLabel}
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as SheetCategoryFilter)}
              >
                <option value="all">{sheetFilterAllCategoriesLabel}</option>
                <option value="Player">{sheetTypeLabels.Player}</option>
                <option value="Creature">{sheetTypeLabels.Creature}</option>
                <option value="Npc">{sheetTypeLabels.Npc}</option>
              </select>
            </label>
          </div>
          <fieldset>
            <legend>{lineupSheetsLabel}</legend>
            {sheets.length === 0 ? (
              <p className="muted">{sheetRepositoryEmptyMessage}</p>
            ) : visibleSheets.length === 0 ? (
              <p className="muted">{sheetFilterEmptyMessage}</p>
            ) : (
              visibleSheets.map((sheet) => {
                const quantity = quantities[sheet.id] ?? 0;
                const max = lineupQuantityMax(sheet.type);
                return (
                  <div key={sheet.id} className="lineup-sheet-option">
                    {sheet.imageUrl ? (
                      <img className="lineup-sheet-thumb" src={resolveApiUrl(sheet.imageUrl)} alt="" />
                    ) : (
                      <span className="lineup-sheet-thumb" aria-hidden="true" />
                    )}
                    <span className="lineup-sheet-name">
                      {`${sheet.name} - ${sheetTypeLabels[sheet.type] ?? sheet.type}`}
                    </span>
                    <div className="lineup-qty">
                      <button
                        type="button"
                        aria-label={lineupQuantityDecreaseLabel(sheet.name)}
                        disabled={quantity <= 0}
                        onClick={() => setQuantity(sheet.id, sheet.type, quantity - 1)}
                      >
                        {'<'}
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={max}
                        value={quantity}
                        aria-label={lineupQuantityFieldLabel(sheet.name)}
                        onChange={(event) => setQuantity(sheet.id, sheet.type, Number(event.target.value))}
                      />
                      <button
                        type="button"
                        aria-label={lineupQuantityIncreaseLabel(sheet.name)}
                        disabled={quantity >= max}
                        onClick={() => setQuantity(sheet.id, sheet.type, quantity + 1)}
                      >
                        {'>'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </fieldset>
          <div className="row">
            <button type="submit">{editingId ? lineupSaveLabel : lineupIncludeLabel}</button>
            {editingId && (
              <button type="button" className="ghost" onClick={resetForm}>
                {lineupCancelLabel}
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Cenas</h2>
        {lineups.length === 0 ? (
          <p className="muted">{lineupEmptyMessage}</p>
        ) : (
          <ul className="lineup-list">
            {lineups.map((lineup) => (
              <li key={lineup.id}>
                <div>
                  <strong>{lineup.name}</strong>
                  <p className="muted">
                    {lineup.members.map((member) => formatLineupMemberSummary(member.sheetName, member.quantity)).join(', ')}
                  </p>
                </div>
                <div className="row">
                  <button type="button" className="ghost" onClick={() => startEdit(lineup)}>
                    {lineupEditLabel}
                  </button>
                  <button type="button" className="ghost danger" onClick={() => void remove(lineup)}>
                    {lineupDeleteLabel}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
