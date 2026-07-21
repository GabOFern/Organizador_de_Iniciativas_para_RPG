import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { routes } from '../config';
import type { PublicBattleSummary } from '../types';

const POLL_MS = 5000;

function statusLabel(status: string): string {
  if (status === 'Preparing') return 'Preparando';
  if (status === 'Active') return 'Em combate';
  return status;
}

function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PublicLobbyPage() {
  const [battles, setBattles] = useState<PublicBattleSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await api.listPublicBattles();
      setBattles(list);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar batalhas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);

    function onFocus() {
      void load();
    }

    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  return (
    <main className="page public-page">
      <header className="public-header brand-mark">
        <div className="brand-ornament" aria-hidden />
        <h1 className="brand-title">Iniciativas RPG</h1>
        <p className="lede">Batalhas em andamento</p>
        <div className="brand-ornament" aria-hidden />
      </header>

      {error && <p className="error">{error}</p>}

      {loading && battles.length === 0 ? (
        <section className="panel narrow">
          <p className="muted">Carregando…</p>
        </section>
      ) : battles.length === 0 ? (
        <section className="panel narrow">
          <p>Nenhuma batalha em andamento.</p>
        </section>
      ) : (
        <section className="battle-lobby" aria-label="Batalhas abertas">
          {battles.map((battle) => {
            const namesPreview =
              battle.combatantNames.length === 0
                ? 'Sem combatentes ainda'
                : battle.combatantNames.slice(0, 4).join(', ') +
                  (battle.combatantNames.length > 4
                    ? ` +${battle.combatantNames.length - 4}`
                    : '');

            return (
              <Link
                key={battle.publicToken}
                to={routes.publicBattle(battle.publicToken)}
                className="battle-lobby-card"
              >
                <div className="battle-lobby-card-top">
                  <span className={`battle-lobby-status is-${battle.status.toLowerCase()}`}>
                    {statusLabel(battle.status)}
                  </span>
                  <span className="muted battle-lobby-time">
                    {formatCreatedAt(battle.createdAtUtc)}
                  </span>
                </div>
                <p className="battle-lobby-count">
                  {battle.combatantCount}{' '}
                  {battle.combatantCount === 1 ? 'combatente' : 'combatentes'}
                </p>
                <p className="battle-lobby-names muted">{namesPreview}</p>
                <span className="battle-lobby-enter">Entrar</span>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}
