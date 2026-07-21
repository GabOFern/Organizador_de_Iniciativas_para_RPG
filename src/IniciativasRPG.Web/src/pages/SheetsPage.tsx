import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import type { Sheet, SheetType } from '../types';

const emptyForm = {
  name: '',
  imageUrl: '',
  type: 'Player' as SheetType,
  maxHp: 10,
  currentHp: 10,
  baseAc: 10,
  dexModifier: 0,
};

export function SheetsPage() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setSheets(await api.listSheets());
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar fichas.'),
    );
  }, []);

  function startEdit(sheet: Sheet) {
    setEditingId(sheet.id);
    setForm({
      name: sheet.name,
      imageUrl: sheet.imageUrl ?? '',
      type: sheet.type,
      maxHp: sheet.maxHp,
      currentHp: sheet.currentHp,
      baseAc: sheet.baseAc,
      dexModifier: sheet.dexModifier,
    });
    setError(null);
    setMessage(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      if (editingId) {
        await api.updateSheet(editingId, {
          name: form.name,
          imageUrl: form.imageUrl || null,
          type: form.type,
          maxHp: form.maxHp,
          currentHp: form.currentHp,
          baseAc: form.baseAc,
          dexModifier: form.dexModifier,
        });
        setMessage('Ficha atualizada.');
      } else {
        await api.createSheet({
          name: form.name,
          imageUrl: form.imageUrl || null,
          type: form.type,
          maxHp: form.maxHp,
          baseAc: form.baseAc,
          dexModifier: form.dexModifier,
        });
        setMessage('Ficha criada.');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao salvar ficha.');
    }
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <h2>{editingId ? 'Editar ficha' : 'Nova ficha'}</h2>
        <form className="stack" onSubmit={onSubmit}>
          <label>
            Nome *
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label>
            URL da imagem
            <input
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />
          </label>
          <label>
            Tipo
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as SheetType }))}
            >
              <option value="Player">Player</option>
              <option value="Creature">Criatura</option>
              <option value="Npc">NPC</option>
            </select>
          </label>
          <div className="row">
            <label>
              Vida máxima
              <input
                type="number"
                min={1}
                value={form.maxHp}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    maxHp: Number(e.target.value),
                    currentHp: editingId ? f.currentHp : Number(e.target.value),
                  }))
                }
              />
            </label>
            {editingId && (
              <label>
                Vida atual
                <input
                  type="number"
                  min={0}
                  value={form.currentHp}
                  onChange={(e) => setForm((f) => ({ ...f, currentHp: Number(e.target.value) }))}
                />
              </label>
            )}
            <label>
              CA base
              <input
                type="number"
                value={form.baseAc}
                onChange={(e) => setForm((f) => ({ ...f, baseAc: Number(e.target.value) }))}
              />
            </label>
            <label>
              Mod. Destreza
              <input
                type="number"
                value={form.dexModifier}
                onChange={(e) => setForm((f) => ({ ...f, dexModifier: Number(e.target.value) }))}
              />
            </label>
          </div>
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
          <div className="row">
            <button type="submit">{editingId ? 'Salvar' : 'Cadastrar'}</button>
            {editingId && (
              <button type="button" className="ghost" onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Repositório de fichas</h2>
        {sheets.length === 0 ? (
          <p className="muted">Nenhuma ficha cadastrada.</p>
        ) : (
          <ul className="sheet-list">
            {sheets.map((sheet) => (
              <li key={sheet.id}>
                <div>
                  <strong>{sheet.name}</strong>
                  <span className="muted">
                    {' '}
                    · {sheet.type} · HP {sheet.currentHp}/{sheet.maxHp} · CA {sheet.baseAc} · DEX{' '}
                    {sheet.dexModifier}
                  </span>
                </div>
                <button type="button" className="ghost" onClick={() => startEdit(sheet)}>
                  Editar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
