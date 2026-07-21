import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { CombatantCard } from '../components/CombatantCard';
import { useBattleHub } from '../hooks/useBattleHub';
import type { BattleSnapshot } from '../types';

const empty: BattleSnapshot = {
  id: null,
  publicToken: null,
  status: 'Finished',
  currentTurnIndex: 0,
  combatants: [],
  message: 'Não há combate em andamento.',
  lastDiceRoll: null,
};

export function PublicBattlePage() {
  const { token } = useParams<{ token: string }>();
  const [battle, setBattle] = useState<BattleSnapshot>(empty);
  const [error, setError] = useState<string | null>(null);

  const onUpdate = useCallback((snapshot: BattleSnapshot) => {
    setBattle(snapshot);
  }, []);

  useBattleHub(token, onUpdate);

  useEffect(() => {
    if (!token) return;
    void api
      .getPublicBattle(token)
      .then(setBattle)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Falha ao carregar combate.'),
      );
  }, [token]);

  const noActive =
    battle.status === 'Finished' ||
    !battle.id ||
    Boolean(battle.message && battle.combatants.length === 0);

  return (
    <main className="page public-page">
      <header className="public-header brand-mark">
        <div className="brand-ornament" aria-hidden />
        <h1 className="brand-title">Iniciativas RPG</h1>
        <p className="lede">Acompanhamento ao vivo — somente leitura</p>
        <div className="brand-ornament" aria-hidden />
      </header>

      {error && <p className="error">{error}</p>}

      {noActive ? (
        <section className="panel narrow">
          <p>{battle.message ?? 'Não há combate em andamento.'}</p>
        </section>
      ) : (
        <section className="panel">
          <p className="muted">
            Status: <strong>{battle.status}</strong>
          </p>
          <div className="combatant-grid">
            {battle.combatants.map((c) => (
              <CombatantCard key={c.id} combatant={c} readOnly />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
