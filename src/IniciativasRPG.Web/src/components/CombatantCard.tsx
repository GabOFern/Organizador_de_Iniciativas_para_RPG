import type { Combatant } from '../types';

interface CombatantCardProps {
  combatant: Combatant;
  readOnly?: boolean;
  onDamage?: (combatantId: string, amount: number) => void;
  onKill?: (combatantId: string) => void;
}

export function CombatantCard({
  combatant,
  readOnly = false,
  onDamage,
  onKill,
}: CombatantCardProps) {
  const showKill = !readOnly && combatant.currentHp === 0 && !combatant.isDead;

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

        {!readOnly && !combatant.isDead && (
          <div className="combatant-actions">
            <form
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

            {showKill && onKill && (
              <button type="button" className="danger" onClick={() => onKill(combatant.id)}>
                Matar
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
