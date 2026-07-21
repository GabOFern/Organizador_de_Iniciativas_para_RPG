import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import { ModifierIcon } from '../components/ModifierIcon';
import {
  DAMAGE_MODE_LABELS,
  HEAL_MODE_LABELS,
  MODIFIER_ICON_KEYS,
  MODIFIER_ICON_LABELS,
  summarizeModifierEffect,
  type DamageMode,
} from '../modifierIcons';
import type { ModifierType, ModifierTypePayload } from '../types';

const emptyForm: ModifierTypePayload = {
  name: '',
  defaultDuration: 1,
  skipsTurn: false,
  iconKey: 'generic',
  iconUrl: null,
  acDelta: 0,
  damageMode: 'None',
  damageAmount: null,
  damageDice: null,
  healMode: 'None',
  healAmount: null,
  healDice: null,
};

export function ModifiersPage() {
  const [types, setTypes] = useState<ModifierType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ModifierTypePayload>(emptyForm);
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
      iconKey: item.iconKey || 'generic',
      iconUrl: item.iconUrl,
      acDelta: item.acDelta,
      damageMode: (item.damageMode as DamageMode) || 'None',
      damageAmount: item.damageAmount,
      damageDice: item.damageDice,
      healMode: (item.healMode as DamageMode) || 'None',
      healAmount: item.healAmount,
      healDice: item.healDice,
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

    const payload: ModifierTypePayload = {
      ...form,
      iconUrl: form.iconUrl?.trim() ? form.iconUrl.trim() : null,
      damageAmount: form.damageMode === 'Fixed' ? form.damageAmount : null,
      damageDice:
        form.damageMode === 'DicePerTurn' || form.damageMode === 'DiceOnce'
          ? form.damageDice
          : null,
      healAmount: form.healMode === 'Fixed' ? form.healAmount : null,
      healDice:
        form.healMode === 'DicePerTurn' || form.healMode === 'DiceOnce' ? form.healDice : null,
    };

    try {
      if (editingId) {
        await api.updateModifierType(editingId, payload);
        setMessage('Tipo atualizado.');
      } else {
        await api.createModifierType(payload);
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

          <fieldset className="icon-picker">
            <legend>Ícone</legend>
            <div className="icon-picker-grid">
              {MODIFIER_ICON_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={form.iconKey === key ? 'icon-option is-selected' : 'icon-option'}
                  title={MODIFIER_ICON_LABELS[key]}
                  onClick={() => setForm((f) => ({ ...f, iconKey: key }))}
                >
                  <ModifierIcon iconKey={key} />
                  <span>{MODIFIER_ICON_LABELS[key]}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <label>
            URL do ícone (opcional)
            <input
              value={form.iconUrl ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, iconUrl: e.target.value || null }))
              }
              placeholder="https://…"
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

          <label>
            Modificador de CA
            <input
              type="number"
              value={form.acDelta}
              onChange={(e) => setForm((f) => ({ ...f, acDelta: Number(e.target.value) }))}
            />
          </label>

          <label>
            Dano periódico
            <select
              value={form.damageMode}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  damageMode: e.target.value as DamageMode,
                }))
              }
            >
              {(Object.keys(DAMAGE_MODE_LABELS) as DamageMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {DAMAGE_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </label>

          {form.damageMode === 'Fixed' && (
            <label>
              Valor do dano
              <input
                type="number"
                min={1}
                value={form.damageAmount ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    damageAmount: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                required
              />
            </label>
          )}

          {(form.damageMode === 'DicePerTurn' || form.damageMode === 'DiceOnce') && (
            <label>
              Notação do dado (dano)
              <input
                value={form.damageDice ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, damageDice: e.target.value || null }))
                }
                placeholder="1d6"
                required
              />
            </label>
          )}

          <label>
            Regeneração periódica
            <select
              value={form.healMode}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  healMode: e.target.value as DamageMode,
                }))
              }
            >
              {(Object.keys(HEAL_MODE_LABELS) as DamageMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {HEAL_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </label>

          {form.healMode === 'Fixed' && (
            <label>
              Valor da regeneração
              <input
                type="number"
                min={1}
                value={form.healAmount ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    healAmount: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                required
              />
            </label>
          )}

          {(form.healMode === 'DicePerTurn' || form.healMode === 'DiceOnce') && (
            <label>
              Notação do dado (regeneração)
              <input
                value={form.healDice ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, healDice: e.target.value || null }))}
                placeholder="1d4"
                required
              />
            </label>
          )}

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
                <div className="modifier-type-row">
                  <ModifierIcon iconKey={t.iconKey} iconUrl={t.iconUrl} title={t.name} />
                  <div>
                    <strong>{t.name}</strong>
                    <span className="muted">
                      {' '}
                      · {t.defaultDuration} turno(s)
                      {' · '}
                      {summarizeModifierEffect({
                        skipsTurn: t.skipsTurn,
                        acDelta: t.acDelta,
                        damageMode: t.damageMode,
                        damageAmount: t.damageAmount,
                        damageDice: t.damageDice,
                        healMode: t.healMode,
                        healAmount: t.healAmount,
                        healDice: t.healDice,
                      })}
                    </span>
                  </div>
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
