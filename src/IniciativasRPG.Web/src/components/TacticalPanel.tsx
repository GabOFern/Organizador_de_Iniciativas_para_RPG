import { abilityLabels, characterClassLabels, strikeTypeLabels } from '../config';
import type {
  AbilityName,
  CharacterClass,
  CombatantTactical,
  SheetAttack,
  SheetSpell,
  SheetWeapon,
  StrikeType,
} from '../types';

interface TacticalPanelProps {
  data: CombatantTactical;
  onClose: () => void;
}

function modLabel(mod: number) {
  return mod >= 0 ? `+${mod}` : String(mod);
}

function abilityLabel(value: string) {
  return abilityLabels[value as AbilityName] ?? value;
}

function strikeLabel(value: string) {
  return strikeTypeLabels[value as StrikeType] ?? value;
}

function AttackItem({ item }: { item: SheetAttack }) {
  return (
    <li>
      <strong>{item.description}</strong>
      <span className="muted">
        {' '}
        · {item.damageDice} · {abilityLabel(item.abilityBase)} · {strikeLabel(item.strikeType)}
      </span>
    </li>
  );
}

function SpellItem({ item }: { item: SheetSpell }) {
  return (
    <li>
      <strong>{item.description}</strong>
      <span className="muted">
        {' '}
        · slot {item.slotLevel}
        {item.damageDice ? ` · ${item.damageDice}` : ''} · {abilityLabel(item.abilityBase)}
        {item.requiresMaterial ? ' · material' : ''}
      </span>
    </li>
  );
}

function WeaponItem({ item }: { item: SheetWeapon }) {
  return (
    <li>
      <strong>{item.description}</strong>
      <span className="muted">
        {' '}
        · {item.damageDice} · {item.range} · {strikeLabel(item.strikeType)}
      </span>
    </li>
  );
}

export function TacticalPanel({ data, onClose }: TacticalPanelProps) {
  const classLabel =
    characterClassLabels[data.class as CharacterClass] ?? data.class;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel panel tactical-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tactical-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="tactical-title">{data.name}</h2>
          <button type="button" className="ghost" onClick={onClose}>
            Fechar
          </button>
        </header>
        <p className="muted">
          {data.sheetType} · {classLabel}
        </p>

        <section>
          <h3>Atributos</h3>
          <dl className="tactical-ability-grid">
            <div>
              <dt>For</dt>
              <dd>
                {data.strength} ({modLabel(data.strengthMod)})
              </dd>
            </div>
            <div>
              <dt>Des</dt>
              <dd>
                {data.dexterity} ({modLabel(data.dexterityMod)})
              </dd>
            </div>
            <div>
              <dt>Con</dt>
              <dd>
                {data.constitution} ({modLabel(data.constitutionMod)})
              </dd>
            </div>
            <div>
              <dt>Int</dt>
              <dd>
                {data.intelligence} ({modLabel(data.intelligenceMod)})
              </dd>
            </div>
            <div>
              <dt>Sab</dt>
              <dd>
                {data.wisdom} ({modLabel(data.wisdomMod)})
              </dd>
            </div>
            <div>
              <dt>Car</dt>
              <dd>
                {data.charisma} ({modLabel(data.charismaMod)})
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h3>Resistências</h3>
          <p>{data.resistances?.trim() || '—'}</p>
        </section>

        <section>
          <h3>Ataques</h3>
          {data.attacks.length === 0 ? (
            <p className="muted">Nenhum cadastrado ainda.</p>
          ) : (
            <ul className="tactical-item-list">
              {data.attacks.map((item, i) => (
                <AttackItem key={item.id ?? i} item={item} />
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3>Magias</h3>
          {data.spells.length === 0 ? (
            <p className="muted">Nenhuma cadastrada ainda.</p>
          ) : (
            <ul className="tactical-item-list">
              {data.spells.map((item, i) => (
                <SpellItem key={item.id ?? i} item={item} />
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3>Armas</h3>
          {data.weapons.length === 0 ? (
            <p className="muted">Nenhuma cadastrada ainda.</p>
          ) : (
            <ul className="tactical-item-list">
              {data.weapons.map((item, i) => (
                <WeaponItem key={item.id ?? i} item={item} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
