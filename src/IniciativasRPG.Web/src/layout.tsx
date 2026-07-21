import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './auth';
import { routes } from './config';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to={routes.login} replace />;
  }
  return children;
}

export function MestreLayout() {
  const { username, logout } = useAuth();

  return (
    <div className="mestre-shell">
      <header className="mestre-header">
        <div className="mestre-brand">
          <div className="mestre-brand-name">Iniciativas RPG</div>
          <span className="muted">Mestre: {username}</span>
        </div>
        <nav className="mestre-nav">
          <NavLink to={routes.mestreBattle}>Batalha</NavLink>
          <NavLink to={routes.mestreSheets}>Fichas</NavLink>
          <button type="button" className="ghost" onClick={logout}>
            Sair
          </button>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
