import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../api';
import { useAuth } from '../auth';
import { routes } from '../config';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={routes.mestreBattle} replace />;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const data = new FormData(e.currentTarget);
    try {
      await login(String(data.get('username') ?? ''), String(data.get('password') ?? ''));
      navigate(routes.mestreBattle);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-hero">
        <div className="brand-mark">
          <div className="brand-ornament" aria-hidden />
          <h1 className="brand-title">Iniciativas RPG</h1>
          <p className="brand-subtitle">A mesa do mestre aguarda</p>
          <div className="brand-ornament" aria-hidden />
        </div>

        <section className="panel narrow login-panel">
          <h2>Acesso do mestre</h2>
          <form onSubmit={onSubmit} className="stack">
            <label>
              Usuário
              <input name="username" autoComplete="username" required />
            </label>
            <label>
              Senha
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
