import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { CombatantCard } from '../components/CombatantCard';
import { CombatantListView } from '../components/CombatantListView';
import { ScenePanel } from '../components/ScenePanel';
import { ThemePicker } from '../components/ThemePicker';
import {
  appBrandName,
  noPublicBattleMessage,
  publicBattleHubFallbackMs,
  routes,
  scenesLoadFailedMessage,
} from '../config';
import { useBattleHub } from '../hooks/useBattleHub';
import { useCombatantViewPrefs } from '../hooks/useCombatantViewPrefs';
import { shouldUsePublicRestFallback } from '../publicBattleLoad';
import type { BattleSnapshot, CampaignScene } from '../types';

const empty: BattleSnapshot = {
  id: null,
  publicToken: null,
  status: 'Finished',
  currentTurnIndex: 0,
  combatants: [],
  message: noPublicBattleMessage,
  lastDiceRoll: null,
  isTestBattle: false,
};

export function PublicBattlePage() {
  const { token } = useParams<{ token: string }>();
  const [battle, setBattle] = useState<BattleSnapshot>(empty);
  const [scenes, setScenes] = useState<CampaignScene[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hubFailed, setHubFailed] = useState(false);
  const [receivedSnapshot, setReceivedSnapshot] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const receivedSnapshotRef = useRef(false);
  const receivedScenesRef = useRef(false);
  const restStartedRef = useRef(false);
  const trackedTokenRef = useRef(token);
  const { prefs, setMode, setItemsPerView, setFocusMode } = useCombatantViewPrefs();

  if (trackedTokenRef.current !== token) {
    trackedTokenRef.current = token;
    receivedSnapshotRef.current = false;
    receivedScenesRef.current = false;
    restStartedRef.current = false;
    setBattle(empty);
    setScenes(null);
    setError(null);
    setHubFailed(false);
    setReceivedSnapshot(false);
    setElapsedMs(0);
  }

  const onUpdate = useCallback((snapshot: BattleSnapshot) => {
    receivedSnapshotRef.current = true;
    setReceivedSnapshot(true);
    setBattle(snapshot);
    setError(null);
  }, []);

  const onScenesUpdated = useCallback((list: CampaignScene[]) => {
    receivedScenesRef.current = true;
    setScenes(list);
  }, []);

  const onHubFailed = useCallback(() => {
    setHubFailed(true);
  }, []);

  useBattleHub(token, onUpdate, null, onScenesUpdated, onHubFailed);

  useEffect(() => {
    if (!token || receivedSnapshot || hubFailed) return;
    const timer = window.setTimeout(() => {
      setElapsedMs(publicBattleHubFallbackMs);
    }, publicBattleHubFallbackMs);
    return () => window.clearTimeout(timer);
  }, [token, receivedSnapshot, hubFailed]);

  useEffect(() => {
    if (!token) return;
    if (restStartedRef.current) return;
    if (
      !shouldUsePublicRestFallback({
        hubFailed,
        receivedSnapshot,
        elapsedMs,
        fallbackMs: publicBattleHubFallbackMs,
      })
    ) {
      return;
    }

    restStartedRef.current = true;
    const requestToken = token;

    void api
      .getPublicBattle(requestToken)
      .then((snapshot) => {
        if (trackedTokenRef.current !== requestToken || receivedSnapshotRef.current) return;
        receivedSnapshotRef.current = true;
        setReceivedSnapshot(true);
        setBattle(snapshot);
      })
      .catch((err) => {
        if (trackedTokenRef.current !== requestToken) return;
        setError(err instanceof ApiError ? err.message : 'Falha ao carregar combate.');
      });

    if (!receivedScenesRef.current) {
      void api
        .listPublicScenes(requestToken)
        .then((list) => {
          if (trackedTokenRef.current !== requestToken || receivedScenesRef.current) return;
          receivedScenesRef.current = true;
          setScenes(list);
        })
        .catch((err) => {
          if (trackedTokenRef.current !== requestToken) return;
          setError(err instanceof ApiError ? err.message : scenesLoadFailedMessage);
        });
    }
  }, [token, hubFailed, receivedSnapshot, elapsedMs]);

  const noActive =
    battle.status === 'Finished' ||
    !battle.id ||
    Boolean(battle.message && battle.combatants.length === 0);

  return (
    <main className="page public-page">
      <header className="public-header brand-mark">
        <div className="brand-ornament" aria-hidden />
        <h1 className="brand-title">{appBrandName}</h1>
        <p className="lede">Acompanhamento ao vivo — somente leitura</p>
        <div className="brand-ornament" aria-hidden />
        <div className="public-header-actions">
          <ThemePicker />
          <Link to={routes.publicLobby} className="public-back-link">
            Voltar às campanhas
          </Link>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {noActive ? (
        <section className="panel narrow">
          <p>{battle.message ?? noPublicBattleMessage}</p>
        </section>
      ) : (
        <section className="panel">
          <p className="muted">
            Status: <strong>{battle.status}</strong>
            {battle.isTestBattle && (
              <>
                {' '}
                · <strong>Simulação</strong>
              </>
            )}
          </p>
          {battle.message && <p className="success battle-sim-message">{battle.message}</p>}
          <CombatantListView
            combatants={battle.combatants}
            mode={prefs.mode}
            itemsPerView={prefs.itemsPerView}
            focusMode={prefs.focusMode}
            onModeChange={setMode}
            onItemsPerViewChange={setItemsPerView}
            onFocusModeChange={setFocusMode}
            renderCard={(c) => <CombatantCard combatant={c} readOnly />}
          />
        </section>
      )}

      {token && (
        <ScenePanel
          publicToken={token}
          canEdit={false}
          scenes={scenes}
          onScenesChange={onScenesUpdated}
        />
      )}
    </main>
  );
}
