import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import type { ModifierType } from '../types';

const emptyForm = {
  name: '',
  defaultDuration: 1,
  skipsTurn: false,
};

export function ModifiersPage() {
  const [types, setTypes] = useState<ModifierType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setTypes(await api.listModifierTypes());
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar modificadores.'),
    );
  }, []);

  function startEdit(item: ModifierType) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      defaultDuration: item.defaultDuration,
      skipsTurn: item.skipsTurn,
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
        await api.updateModifierType(editingId, form);
        setMessage('Tipo atualizado.');
      } else {
        await api.createModifierType(form);
        setMessage('Tipo cadastrado.');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao salvar.');
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Remover este tipo de modificador?')) return;
    setError(null);
    try {
      await api.deleteModifierType(id);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao remover.');
    }
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <h2>{editingId ? 'Editar tipo' : 'Novo tipo de modificador'}</h2>
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
            Duração padrão (turnos)
            <input
              type="number"
              min={1}
              value={form.defaultDuration}
              onChange={(e) =>
                setForm((f) => ({ ...f, defaultDuration: Number(e.target.value) }))
              }
              required
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.skipsTurn}
              onChange={(e) => setForm((f) => ({ ...f, skipsTurn: e.target.checked }))}
            />
            Pula turno
          </label>
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
        <h2>Tipos cadastrados</h2>
        {types.length === 0 ? (
          <p className="muted">Nenhum tipo cadastrado.</p>
        ) : (
          <ul className="sheet-list">
            {types.map((t) => (
              <li key={t.id}>
                <div>
                  <strong>{t.name}</strong>
                  <span className="muted">
                    {' '}
                    · {t.defaultDuration} turno(s)
                    {t.skipsTurn ? ' · pula turno' : ''}
                  </span>
                </div>
                <div className="row">
                  <button type="button" className="ghost" onClick={() => startEdit(t)}>
                    Editar
                  </button>
                  <button type="button" className="danger" onClick={() => void onDelete(t.id)}>
                    Remover
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
