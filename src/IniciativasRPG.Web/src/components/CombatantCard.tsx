import type { Combatant, ModifierType } from '../types';

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
      <div className="combatant-media">
        <div className="combatant-media-frame" aria-hidden />
        {combatant.imageUrl ? (
          <img src={combatant.imageUrl} alt={combatant.name} />
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
          {combatant.isCurrentTurn && !combatant.isDead && (
            <span className="turn-badge">Turno</span>
          )}
        </header>

        <dl className="combatant-stats">
          <div>
            <dt>Iniciativa</dt>
            <dd>{combatant.initiative}</dd>
          </div>
          <div>
            <dt>Vida</dt>
            <dd>
              {combatant.currentHp}/{combatant.maxHp}
            </dd>
          </div>
          <div>
            <dt>CA</dt>
            <dd>{combatant.currentAc}</dd>
          </div>
        </dl>

        {modifiers.length > 0 && (
          <ul className="modifier-tags">
            {modifiers.map((m) => (
              <li key={m.id} className={m.skipsTurn ? 'skips-turn' : ''}>
                <span>
                  {m.name} ({m.remainingDuration})
                </span>
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
            ))}
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
              <button type="button" className="danger action-full" onClick={() => onKill(combatant.id)}>
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
                        {t.skipsTurn ? ' (pula turno)' : ''}
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
