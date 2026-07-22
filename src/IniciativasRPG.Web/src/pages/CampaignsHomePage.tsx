import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import { CardFrame } from '../components/CardFrame';
import { ThemePicker } from '../components/ThemePicker';
import { routes } from '../config';
import type { CampaignSummary } from '../types';

const POLL_MS = 5000;

export function CampaignsHomePage() {
  const navigate = useNavigate();
  const { loginCampaign, isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [masterCampaign, setMasterCampaign] = useState<CampaignSummary | null>(null);
  const [password, setPassword] = useState('');
  const [masterError, setMasterError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await api.listCampaigns();
      setCampaigns(list);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar campanhas.');
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

  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.mestreBattle, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    try {
      await api.createCampaign({
        name: String(data.get('name') ?? ''),
        imageUrl: String(data.get('imageUrl') ?? '') || null,
        description: String(data.get('description') ?? '') || null,
        password: String(data.get('password') ?? ''),
      });
      setShowCreate(false);
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao criar campanha.');
    } finally {
      setCreating(false);
    }
  }

  async function onMasterLogin(e: FormEvent) {
    e.preventDefault();
    if (!masterCampaign) return;
    setMasterError(null);
    try {
      await loginCampaign(masterCampaign.id, password);
      setPassword('');
      setMasterCampaign(null);
      navigate(routes.mestreBattle);
    } catch (err) {
      setMasterError(err instanceof ApiError ? err.message : 'Credenciais inválidas.');
    }
  }

  return (
    <main className="page public-page">
      <header className="public-header brand-mark">
        <div className="brand-ornament" aria-hidden />
        <h1 className="brand-title">Iniciativas RPG</h1>
        <p className="lede">Escolha uma campanha para jogar ou mestrar</p>
        <div className="brand-ornament" aria-hidden />
        <div className="public-header-actions">
          <ThemePicker />
          <button type="button" className="ghost" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Fechar formulário' : 'Nova campanha'}
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {showCreate && (
        <section className="panel narrow">
          <h2>Criar campanha</h2>
          <form className="stack" onSubmit={onCreate}>
            <label>
              Nome *
              <input name="name" required />
            </label>
            <label>
              URL da foto
              <input name="imageUrl" />
            </label>
            <label>
              Descrição
              <textarea name="description" rows={3} />
            </label>
            <label>
              Senha do mestre *
              <input name="password" type="password" required autoComplete="new-password" />
            </label>
            <button type="submit" disabled={creating}>
              {creating ? 'Salvando…' : 'Criar'}
            </button>
          </form>
        </section>
      )}

      {loading && campaigns.length === 0 ? (
        <section className="panel narrow">
          <p className="muted">Carregando…</p>
        </section>
      ) : campaigns.length === 0 ? (
        <section className="panel narrow">
          <p>Nenhuma campanha ainda. Crie a primeira para começar.</p>
        </section>
      ) : (
        <section className="battle-lobby" aria-label="Campanhas">
          {campaigns.map((c) => (
            <article key={c.id} className="battle-lobby-card campaign-card">
              <CardFrame />
              {c.imageUrl ? (
                <img className="campaign-card-image" src={c.imageUrl} alt="" />
              ) : (
                <div className="campaign-card-image is-placeholder" aria-hidden>
                  {c.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <h3 className="battle-lobby-count">{c.name}</h3>
              {c.description && <p className="battle-lobby-names muted">{c.description}</p>}
              <div className="campaign-card-actions">
                <button type="button" onClick={() => { setMasterCampaign(c); setPassword(''); setMasterError(null); }}>
                  Mestre
                </button>
                <Link className="button-link" to={routes.publicBattle(c.publicToken)}>
                  Jogador
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}

      {masterCampaign && (
        <div className="modal-backdrop" role="presentation" onClick={() => setMasterCampaign(null)}>
          <div
            className="modal-panel panel narrow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="master-login-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="master-login-title">Mestre — {masterCampaign.name}</h2>
            <form className="stack" onSubmit={onMasterLogin}>
              <label>
                Senha
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  autoFocus
                />
              </label>
              {masterError && <p className="error">{masterError}</p>}
              <div className="row modal-actions">
                <button type="button" className="ghost" onClick={() => setMasterCampaign(null)}>
                  Cancelar
                </button>
                <button type="submit">Entrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
