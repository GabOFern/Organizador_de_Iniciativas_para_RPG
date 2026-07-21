import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth';
import { routes } from './config';
import { MestreLayout, RequireAuth } from './layout';
import { BattlePage } from './pages/BattlePage';
import { LoginPage } from './pages/LoginPage';
import { PublicBattlePage } from './pages/PublicBattlePage';
import { SheetsPage } from './pages/SheetsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path={routes.login} element={<LoginPage />} />
          <Route path="/publico/:token" element={<PublicBattlePage />} />
          <Route
            path={routes.mestre}
            element={
              <RequireAuth>
                <MestreLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to={routes.mestreBattle} replace />} />
            <Route path="batalha" element={<BattlePage />} />
            <Route path="fichas" element={<SheetsPage />} />
          </Route>
          <Route path="*" element={<Navigate to={routes.login} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
