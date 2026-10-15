import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import { ImageFocusPreview } from '../components/ImageFocusPreview';
import {
  abilityLabels,
  abilityNames,
  characterClassLabels,
  characterClasses,
  sheetFeatureKindLabels,
  sheetFeatureKinds,
  strikeTypeLabels,
  strikeTypes,
} from '../config';
import type {
  AbilityName,
  CharacterClass,
  Sheet,
  SheetFeatureKind,
  SheetType,
  StrikeType,
} from '../types';

function abilityMod(score: number) {
  return Math.floor((score - 10) / 2);
}

function formatMod(score: number) {
  const mod = abilityMod(score);
  return mod >= 0 ? `+${mod}` : String(mod);
}

type FeatureDraft = {
  kind: SheetFeatureKind;
  title: string;
  text: string;
};

type AttackDraft = {
  description: string;
  damageDice: string;
  abilityBase: AbilityName;
  strikeType: StrikeType;
};

type SpellDraft = {
  description: string;
  damageDice: string;
  slotLevel: number;
  requiresMaterial: boolean;
  abilityBase: AbilityName;
};

type WeaponDraft = {
  description: string;
  damageDice: string;
  range: string;
  strikeType: StrikeType;
};

const emptyFeature = (): FeatureDraft => ({
  kind: 'Trait',
  title: '',
  text: '',
});

const emptyAttack = (): AttackDraft => ({
  description: '',
  damageDice: '',
  abilityBase: 'Strength',
  strikeType: 'Melee',
});

const emptySpell = (): SpellDraft => ({
  description: '',
  damageDice: '',
  slotLevel: 0,
  requiresMaterial: false,
  abilityBase: 'Intelligence',
});

const emptyWeapon = (): WeaponDraft => ({
  description: '',
  damageDice: '',
  range: '',
  strikeType: 'Melee',
});

const emptyForm = {
  name: '',
  imageUrl: '',
  imageFocusX: 50,
  imageFocusY: 50,
  type: 'Player' as SheetType,
  class: 'None' as CharacterClass,
  maxHp: 10,
  currentHp: 10,
  baseAc: 10,
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  initiativeBonus: 0,
  features: [] as FeatureDraft[],
  attacks: [] as AttackDraft[],
  spells: [] as SpellDraft[],
  weapons: [] as WeaponDraft[],
};

export function SheetsPage() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [initiativeTouched, setInitiativeTouched] = useState(false);
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
      imageFocusX: sheet.imageFocusX ?? 50,
      imageFocusY: sheet.imageFocusY ?? 50,
      type: sheet.type,
      class: (sheet.class as CharacterClass) || 'None',
      maxHp: sheet.maxHp,
      currentHp: sheet.currentHp,
      baseAc: sheet.baseAc,
      strength: sheet.strength,
      dexterity: sheet.dexterity,
      constitution: sheet.constitution,
      intelligence: sheet.intelligence,
      wisdom: sheet.wisdom,
      charisma: sheet.charisma,
      initiativeBonus: sheet.initiativeBonus ?? 0,
      features: (sheet.features ?? []).map((feature) => ({
        kind: (feature.kind as SheetFeatureKind) || 'Trait',
        title: feature.title,
        text: feature.text,
      })),
      attacks: (sheet.attacks ?? []).map((a) => ({
        description: a.description,
        damageDice: a.damageDice,
        abilityBase: (a.abilityBase as AbilityName) || 'Strength',
        strikeType: (a.strikeType as StrikeType) || 'Melee',
      })),
      spells: (sheet.spells ?? []).map((s) => ({
        description: s.description,
        damageDice: s.damageDice ?? '',
        slotLevel: s.slotLevel,
        requiresMaterial: s.requiresMaterial,
        abilityBase: (s.abilityBase as AbilityName) || 'Intelligence',
      })),
      weapons: (sheet.weapons ?? []).map((w) => ({
        description: w.description,
        damageDice: w.damageDice,
        range: w.range,
        strikeType: (w.strikeType as StrikeType) || 'Melee',
      })),
    });
    setError(null);
    setMessage(null);
    setInitiativeTouched(true);
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      features: [],
      attacks: [],
      spells: [],
      weapons: [],
    });
    setInitiativeTouched(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const payload = {
      name: form.name,
      imageUrl: form.imageUrl || null,
      imageFocusX: form.imageFocusX,
      imageFocusY: form.imageFocusY,
      type: form.type,
      class: form.class,
      maxHp: form.maxHp,
      baseAc: form.baseAc,
      strength: form.strength,
      dexterity: form.dexterity,
      constitution: form.constitution,
      intelligence: form.intelligence,
      wisdom: form.wisdom,
      charisma: form.charisma,
      initiativeBonus: form.initiativeBonus,
      features: form.features.map((feature) => ({
        kind: feature.kind,
        title: feature.title,
        text: feature.text,
      })),
      attacks: form.attacks.map((a) => ({
        description: a.description,
        damageDice: a.damageDice,
        abilityBase: a.abilityBase,
        strikeType: a.strikeType,
      })),
      spells: form.spells.map((s) => ({
        description: s.description,
        damageDice: s.damageDice.trim() || null,
        slotLevel: s.slotLevel,
        requiresMaterial: s.requiresMaterial,
        abilityBase: s.abilityBase,
      })),
      weapons: form.weapons.map((w) => ({
        description: w.description,
        damageDice: w.damageDice,
        range: w.range,
        strikeType: w.strikeType,
      })),
    };
    try {
      if (editingId) {
        await api.updateSheet(editingId, { ...payload, currentHp: form.currentHp });
        setMessage('Ficha atualizada.');
      } else {
        await api.createSheet(payload);
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
          <ImageFocusPreview
            imageUrl={form.imageUrl}
            focusX={form.imageFocusX}
            focusY={form.imageFocusY}
            onChange={(imageFocusX, imageFocusY) =>
              setForm((f) => ({ ...f, imageFocusX, imageFocusY }))
            }
          />
          <div className="row">
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
            <label>
              Classe
              <select
                value={form.class}
                onChange={(e) => setForm((f) => ({ ...f, class: e.target.value as CharacterClass }))}
              >
                {characterClasses.map((c) => (
                  <option key={c} value={c}>
                    {characterClassLabels[c]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="row">
            <label>
              Vida máxima
              <input
                type="number"
                value={form.maxHp}
                onChange={(e) => setForm((f) => ({ ...f, maxHp: Number(e.target.value) }))}
                required
              />
            </label>
            {editingId && (
              <label>
                Vida atual
                <input
                  type="number"
                  value={form.currentHp}
                  onChange={(e) => setForm((f) => ({ ...f, currentHp: Number(e.target.value) }))}
                  required
                />
              </label>
            )}
            <label>
              CA base
              <input
                type="number"
                value={form.baseAc}
                onChange={(e) => setForm((f) => ({ ...f, baseAc: Number(e.target.value) }))}
                required
              />
            </label>
          </div>

          <fieldset className="ability-grid">
            <legend>Atributos</legend>
            {(
              [
                ['strength', 'For'],
                ['dexterity', 'Des'],
                ['constitution', 'Con'],
                ['intelligence', 'Int'],
                ['wisdom', 'Sab'],
                ['charisma', 'Car'],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label} <span className="muted">({formatMod(form[key])})</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form[key]}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setForm((f) => ({
                      ...f,
                      [key]: value,
                      ...(key === 'dexterity' && !initiativeTouched
                        ? { initiativeBonus: abilityMod(value) }
                        : {}),
                    }));
                  }}
                  required
                />
              </label>
            ))}
          </fieldset>

          <label>
            Bônus de iniciativa
            <input
              type="number"
              value={form.initiativeBonus}
              onChange={(e) => {
                setInitiativeTouched(true);
                setForm((f) => ({ ...f, initiativeBonus: Number(e.target.value) }));
              }}
              required
            />
          </label>

          <fieldset className="sheet-collection">
            <legend>Linhas da ficha</legend>
            {form.features.length === 0 && <p className="muted">Nenhuma linha.</p>}
            {form.features.map((feature, index) => (
              <div key={index} className="sheet-collection-row">
                <label>
                  Tipo
                  <select
                    value={feature.kind}
                    onChange={(e) =>
                      setForm((f) => {
                        const features = [...f.features];
                        features[index] = {
                          ...features[index],
                          kind: e.target.value as SheetFeatureKind,
                        };
                        return { ...f, features };
                      })
                    }
                  >
                    {sheetFeatureKinds.map((kind) => (
                      <option key={kind} value={kind}>
                        {sheetFeatureKindLabels[kind]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Título
                  <input
                    value={feature.title}
                    onChange={(e) =>
                      setForm((f) => {
                        const features = [...f.features];
                        features[index] = { ...features[index], title: e.target.value };
                        return { ...f, features };
                      })
                    }
                    required
                  />
                </label>
                <label className="sheet-collection-span">
                  <textarea
                    rows={2}
                    value={feature.text}
                    onChange={(e) =>
                      setForm((f) => {
                        const features = [...f.features];
                        features[index] = { ...features[index], text: e.target.value };
                        return { ...f, features };
                      })
                    }
                    required
                  />
                </label>
                <button
                  type="button"
                  className="ghost"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      features: f.features.filter((_, i) => i !== index),
                    }))
                  }
                >
                  Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              className="ghost"
              onClick={() => setForm((f) => ({ ...f, features: [...f.features, emptyFeature()] }))}
            >
              + Linha
            </button>
          </fieldset>

          <fieldset className="sheet-collection">
            <legend>Ataques</legend>
            {form.attacks.length === 0 && <p className="muted">Nenhum ataque.</p>}
            {form.attacks.map((attack, index) => (
              <div key={index} className="sheet-collection-row">
                <label>
                  Descrição
                  <input
                    value={attack.description}
                    onChange={(e) =>
                      setForm((f) => {
                        const attacks = [...f.attacks];
                        attacks[index] = { ...attacks[index], description: e.target.value };
                        return { ...f, attacks };
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Dano *
                  <input
                    value={attack.damageDice}
                    onChange={(e) =>
                      setForm((f) => {
                        const attacks = [...f.attacks];
                        attacks[index] = { ...attacks[index], damageDice: e.target.value };
                        return { ...f, attacks };
                      })
                    }
                    placeholder="1d8+3"
                    required
                  />
                </label>
                <label>
                  Atributo
                  <select
                    value={attack.abilityBase}
                    onChange={(e) =>
                      setForm((f) => {
                        const attacks = [...f.attacks];
                        attacks[index] = {
                          ...attacks[index],
                          abilityBase: e.target.value as AbilityName,
                        };
                        return { ...f, attacks };
                      })
                    }
                  >
                    {abilityNames.map((a) => (
                      <option key={a} value={a}>
                        {abilityLabels[a]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Tipo
                  <select
                    value={attack.strikeType}
                    onChange={(e) =>
                      setForm((f) => {
                        const attacks = [...f.attacks];
                        attacks[index] = {
                          ...attacks[index],
                          strikeType: e.target.value as StrikeType,
                        };
                        return { ...f, attacks };
                      })
                    }
                  >
                    {strikeTypes.map((t) => (
                      <option key={t} value={t}>
                        {strikeTypeLabels[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="ghost"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      attacks: f.attacks.filter((_, i) => i !== index),
                    }))
                  }
                >
                  Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              className="ghost"
              onClick={() => setForm((f) => ({ ...f, attacks: [...f.attacks, emptyAttack()] }))}
            >
              + Ataque
            </button>
          </fieldset>

          <fieldset className="sheet-collection">
            <legend>Magias</legend>
            {form.spells.length === 0 && <p className="muted">Nenhuma magia.</p>}
            {form.spells.map((spell, index) => (
              <div key={index} className="sheet-collection-row">
                <label>
                  Descrição
                  <input
                    value={spell.description}
                    onChange={(e) =>
                      setForm((f) => {
                        const spells = [...f.spells];
                        spells[index] = { ...spells[index], description: e.target.value };
                        return { ...f, spells };
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Dano
                  <input
                    value={spell.damageDice}
                    onChange={(e) =>
                      setForm((f) => {
                        const spells = [...f.spells];
                        spells[index] = { ...spells[index], damageDice: e.target.value };
                        return { ...f, spells };
                      })
                    }
                    placeholder="opcional"
                  />
                </label>
                <label>
                  Slot (0–9)
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={spell.slotLevel}
                    onChange={(e) =>
                      setForm((f) => {
                        const spells = [...f.spells];
                        spells[index] = { ...spells[index], slotLevel: Number(e.target.value) };
                        return { ...f, spells };
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Atributo
                  <select
                    value={spell.abilityBase}
                    onChange={(e) =>
                      setForm((f) => {
                        const spells = [...f.spells];
                        spells[index] = {
                          ...spells[index],
                          abilityBase: e.target.value as AbilityName,
                        };
                        return { ...f, spells };
                      })
                    }
                  >
                    {abilityNames.map((a) => (
                      <option key={a} value={a}>
                        {abilityLabels[a]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="checkbox-inline">
                  <input
                    type="checkbox"
                    checked={spell.requiresMaterial}
                    onChange={(e) =>
                      setForm((f) => {
                        const spells = [...f.spells];
                        spells[index] = {
                          ...spells[index],
                          requiresMaterial: e.target.checked,
                        };
                        return { ...f, spells };
                      })
                    }
                  />
                  Material
                </label>
                <button
                  type="button"
                  className="ghost"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      spells: f.spells.filter((_, i) => i !== index),
                    }))
                  }
                >
                  Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              className="ghost"
              onClick={() => setForm((f) => ({ ...f, spells: [...f.spells, emptySpell()] }))}
            >
              + Magia
            </button>
          </fieldset>

          <fieldset className="sheet-collection">
            <legend>Armas</legend>
            {form.weapons.length === 0 && <p className="muted">Nenhuma arma.</p>}
            {form.weapons.map((weapon, index) => (
              <div key={index} className="sheet-collection-row">
                <label>
                  Descrição
                  <input
                    value={weapon.description}
                    onChange={(e) =>
                      setForm((f) => {
                        const weapons = [...f.weapons];
                        weapons[index] = { ...weapons[index], description: e.target.value };
                        return { ...f, weapons };
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Dano *
                  <input
                    value={weapon.damageDice}
                    onChange={(e) =>
                      setForm((f) => {
                        const weapons = [...f.weapons];
                        weapons[index] = { ...weapons[index], damageDice: e.target.value };
                        return { ...f, weapons };
                      })
                    }
                    placeholder="1d8"
                    required
                  />
                </label>
                <label>
                  Alcance
                  <input
                    value={weapon.range}
                    onChange={(e) =>
                      setForm((f) => {
                        const weapons = [...f.weapons];
                        weapons[index] = { ...weapons[index], range: e.target.value };
                        return { ...f, weapons };
                      })
                    }
                    placeholder="18m"
                    required
                  />
                </label>
                <label>
                  Tipo
                  <select
                    value={weapon.strikeType}
                    onChange={(e) =>
                      setForm((f) => {
                        const weapons = [...f.weapons];
                        weapons[index] = {
                          ...weapons[index],
                          strikeType: e.target.value as StrikeType,
                        };
                        return { ...f, weapons };
                      })
                    }
                  >
                    {strikeTypes.map((t) => (
                      <option key={t} value={t}>
                        {strikeTypeLabels[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="ghost"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      weapons: f.weapons.filter((_, i) => i !== index),
                    }))
                  }
                >
                  Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              className="ghost"
              onClick={() => setForm((f) => ({ ...f, weapons: [...f.weapons, emptyWeapon()] }))}
            >
              + Arma
            </button>
          </fieldset>

          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
          <div className="row">
            <button type="submit">{editingId ? 'Salvar' : 'Criar'}</button>
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
                    · {sheet.type} · {characterClassLabels[sheet.class as CharacterClass] ?? sheet.class} · HP{' '}
                    {sheet.currentHp}/{sheet.maxHp} · CA {sheet.baseAc} · DES {sheet.dexterityMod >= 0 ? '+' : ''}
                    {sheet.dexterityMod}
                    {' '}
                    · INI {sheet.initiativeBonus >= 0 ? '+' : ''}
                    {sheet.initiativeBonus}
                    {(sheet.features?.length || sheet.attacks?.length || sheet.spells?.length || sheet.weapons?.length)
                      ? ` · ${sheet.features?.length ?? 0} linhas · ${sheet.attacks?.length ?? 0} atq · ${sheet.spells?.length ?? 0} mag · ${sheet.weapons?.length ?? 0} arma`
                      : ''}
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
