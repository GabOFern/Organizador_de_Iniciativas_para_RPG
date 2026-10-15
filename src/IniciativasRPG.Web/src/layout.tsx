import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './auth';
import { ScenePanel } from './components/ScenePanel';
import { ThemePicker } from './components/ThemePicker';
import { routes } from './config';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to={routes.home} replace />;
  }
  return children;
}

export function MestreLayout() {
  const { campaignName, campaignPublicToken, logout } = useAuth();

  return (
    <div className="mestre-shell">
      <header className="mestre-header">
        <div className="mestre-brand">
          <div className="mestre-brand-name">Iniciativas RPG</div>
          <span className="muted">Campanha: {campaignName}</span>
        </div>
        <nav className="mestre-nav">
          <NavLink to={routes.mestreBattle}>Batalha</NavLink>
          <NavLink to={routes.mestreSheets}>Fichas</NavLink>
          <NavLink to={routes.mestreModifiers}>Modificadores</NavLink>
          {campaignPublicToken && (
            <Link to={routes.publicBattle(campaignPublicToken)} target="_blank" rel="noreferrer">
              Visão jogador
            </Link>
          )}
          <ThemePicker />
          <button type="button" className="ghost" onClick={logout}>
            Sair
          </button>
        </nav>
      </header>
      <Outlet />
      {campaignPublicToken && <ScenePanel publicToken={campaignPublicToken} canEdit />}
    </div>
  );
}
