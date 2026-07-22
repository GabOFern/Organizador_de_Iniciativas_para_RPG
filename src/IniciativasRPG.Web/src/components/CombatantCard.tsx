import { CardFrame } from './CardFrame';
import { ModifierIcon } from './ModifierIcon';
import { summarizeModifierEffect } from '../modifierIcons';
import type { ActiveModifier, Combatant, ModifierType } from '../types';

interface CombatantCardProps {
  combatant: Combatant;
  readOnly?: boolean;
  modifierTypes?: ModifierType[];
  onDamage?: (combatantId: string, amount: number) => void;
  onHeal?: (combatantId: string, amount: number) => void;
  onKill?: (combatantId: string) => void;
  onRevive?: (combatantId: string, healAmount?: number) => void;
  onApplyModifier?: (combatantId: string, modifierTypeId: string, duration?: number) => void;
  onRemoveModifier?: (activeModifierId: string) => void;
  onOpenTactical?: (combatantId: string) => void;
}

function modifierTitle(m: ActiveModifier): string {
  const effect = summarizeModifierEffect(m);
  return `${m.name} · ${effect} · ${m.remainingDuration} turno(s)`;
}

function damageBadgeValue(m: ActiveModifier): number | null {
  if (m.lastTickDamage != null) return m.lastTickDamage;
  if (m.damageMode === 'DiceOnce' && m.resolvedDamage != null) return m.resolvedDamage;
  if (m.damageMode === 'Fixed' && m.damageAmount != null) return m.damageAmount;
  return null;
}

function healBadgeValue(m: ActiveModifier): number | null {
  if (m.lastTickHeal != null) return m.lastTickHeal;
  if (m.healMode === 'DiceOnce' && m.resolvedHeal != null) return m.resolvedHeal;
  if (m.healMode === 'Fixed' && m.healAmount != null) return m.healAmount;
  return null;
}

export function CombatantCard({
  combatant,
  readOnly = false,
  modifierTypes = [],
  onDamage,
  onHeal,
  onKill,
  onRevive,
  onApplyModifier,
  onRemoveModifier,
  onOpenTactical,
}: CombatantCardProps) {
  const showKill = !readOnly && combatant.currentHp === 0 && !combatant.isDead;
  const modifiers = combatant.modifiers ?? [];

  return (
    <article
      className={[
        'combatant-card',
        combatant.isCurrentTurn ? 'is-current' : '',
        combatant.isDead ? 'is-dead' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <CardFrame />
      <div className="combatant-media">
        <div className="combatant-media-frame" aria-hidden />
        {combatant.imageUrl ? (
          <img
            src={combatant.imageUrl}
            alt={combatant.name}
            style={{
              objectPosition: `${combatant.imageFocusX ?? 50}% ${combatant.imageFocusY ?? 50}%`,
            }}
          />
        ) : (
          <div className="combatant-placeholder" aria-hidden>
            {combatant.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        {combatant.isDead && <span className="death-mark" aria-label="Morto">✕</span>}
      </div>

      <div className="combatant-body">
        <header className="combatant-header">
          <h3>{combatant.name}</h3>
          <div className="combatant-header-actions">
            {combatant.isCurrentTurn && !combatant.isDead && (
              <span className="turn-badge">Turno</span>
            )}
            {!readOnly && onOpenTactical && (
              <button
                type="button"
                className="ghost"
                onClick={() => onOpenTactical(combatant.id)}
              >
                Detalhes
              </button>
            )}
          </div>
        </header>

        <dl className="combatant-stats">
          <div>
            <dt>Iniciativa</dt>
            <dd>{combatant.initiative}</dd>
          </div>
          <div>
            <dt>Vida</dt>
            <dd>
              {readOnly && combatant.hideHpFromPublic
                ? '???'
                : `${combatant.currentHp}/${combatant.maxHp}`}
              {!readOnly && combatant.hideHpFromPublic && (
                <span className="hp-hidden-hint" title="Vida oculta no link público">
                  {' '}
                  (oculta)
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>CA</dt>
            <dd>{combatant.currentAc}</dd>
          </div>
        </dl>

        {modifiers.length > 0 && (
          <ul className="modifier-tags">
            {modifiers.map((m) => {
              const dmg = damageBadgeValue(m);
              const heal = healBadgeValue(m);
              return (
                <li
                  key={m.id}
                  className={[
                    m.skipsTurn ? 'skips-turn' : '',
                    m.acDelta !== 0 ? 'has-ac' : '',
                    m.damageMode !== 'None' ? 'has-damage' : '',
                    m.healMode !== 'None' ? 'has-heal' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  title={modifierTitle(m)}
                >
                  <ModifierIcon iconKey={m.iconKey} iconUrl={m.iconUrl} title={m.name} />
                  <span className="mod-duration">{m.remainingDuration}</span>
                  {dmg != null && <span className="mod-damage">{dmg}</span>}
                  {heal != null && <span className="mod-heal">+{heal}</span>}
                  {!readOnly && onRemoveModifier && (
                    <button
                      type="button"
                      className="ghost tag-remove"
                      aria-label={`Remover ${m.name}`}
                      onClick={() => onRemoveModifier(m.id)}
                    >
                      ×
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!readOnly && combatant.isDead && onRevive && (
          <div className="combatant-actions">
            <form
              className={combatant.currentHp <= 0 ? 'action-stack' : 'action-row'}
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const healAmount = Number(data.get('healAmount'));
                if (combatant.currentHp <= 0) {
                  if (healAmount > 0) onRevive(combatant.id, healAmount);
                } else {
                  onRevive(combatant.id);
                }
                e.currentTarget.reset();
              }}
            >
              {combatant.currentHp <= 0 && (
                <label>
                  Vida ao reviver
                  <input name="healAmount" type="number" min={1} max={combatant.maxHp} required />
                </label>
              )}
              <button type="submit">Reviver</button>
            </form>
          </div>
        )}

        {!readOnly && !combatant.isDead && (
          <div className="combatant-actions">
            <form
              className="action-row"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                const amount = Number(data.get('damage'));
                if (amount > 0 && onDamage) {
                  onDamage(combatant.id, amount);
                  form.reset();
                }
              }}
            >
              <label>
                Dano
                <input name="damage" type="number" min={1} required />
              </label>
              <button type="submit">Aplicar</button>
            </form>

            <form
              className="action-row"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                const amount = Number(data.get('heal'));
                if (amount > 0 && onHeal) {
                  onHeal(combatant.id, amount);
                  form.reset();
                }
              }}
            >
              <label>
                Cura
                <input name="heal" type="number" min={1} required />
              </label>
              <button type="submit">Curar</button>
            </form>

            {showKill && onKill && (
              <button
                type="button"
                className="danger action-full"
                onClick={() => onKill(combatant.id)}
              >
                Matar
              </button>
            )}

            {modifierTypes.length > 0 && onApplyModifier && (
              <form
                className="action-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = new FormData(form);
                  const typeId = String(data.get('modifierTypeId') ?? '');
                  const durationRaw = String(data.get('duration') ?? '');
                  const duration = durationRaw ? Number(durationRaw) : undefined;
                  if (typeId) {
                    onApplyModifier(combatant.id, typeId, duration);
                    form.reset();
                  }
                }}
              >
                <label>
                  Modificador
                  <select name="modifierTypeId" required defaultValue="">
                    <option value="" disabled>
                      Selecionar…
                    </option>
                    {modifierTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.skipsTurn ? ' (pula)' : ''}
                        {t.acDelta !== 0 ? ` CA${t.acDelta > 0 ? '+' : ''}${t.acDelta}` : ''}
                        {t.damageMode !== 'None' ? ' · dano' : ''}
                        {t.healMode !== 'None' ? ' · regen' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Duração (opcional)
                  <input name="duration" type="number" min={1} placeholder="padrão" />
                </label>
                <button type="submit" className="action-full">
                  Aplicar efeito
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
