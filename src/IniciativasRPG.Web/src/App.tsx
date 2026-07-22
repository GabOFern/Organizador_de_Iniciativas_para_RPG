import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth';
import { routes } from './config';
import { MestreLayout, RequireAuth } from './layout';
import { BattlePage } from './pages/BattlePage';
import { CampaignsHomePage } from './pages/CampaignsHomePage';
import { ModifiersPage } from './pages/ModifiersPage';
import { PublicBattlePage } from './pages/PublicBattlePage';
import { SheetsPage } from './pages/SheetsPage';
import { ThemeProvider } from './theme';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path={routes.home} element={<CampaignsHomePage />} />
            <Route path={routes.login} element={<Navigate to={routes.home} replace />} />
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
              <Route path="modificadores" element={<ModifiersPage />} />
            </Route>
            <Route path="*" element={<Navigate to={routes.home} replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
