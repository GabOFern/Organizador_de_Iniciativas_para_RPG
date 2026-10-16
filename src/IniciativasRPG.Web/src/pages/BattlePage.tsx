import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import { CombatantCard } from '../components/CombatantCard';
import { InvokeModal, type InvokePayload } from '../components/InvokeModal';
import { TacticalPanel } from '../components/TacticalPanel';
import { shouldRunTestBattleTicks, TEST_BATTLE_TICK_MS } from '../demoBattle';
import { useBattleHub } from '../hooks/useBattleHub';
import { fetchShareOrigin, resolvePublicBattleUrl } from '../shareOrigin';
import type { BattleSnapshot, CombatantTactical, ModifierType, Sheet } from '../types';

const emptyBattle: BattleSnapshot = {
  id: null,
  publicToken: null,
  status: 'Finished',
  currentTurnIndex: 0,
  combatants: [],
  message: null,
  lastDiceRoll: null,
  canSavePlayerStats: false,
  isTestBattle: false,
};

export function BattlePage() {
  const { token } = useAuth();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [modifierTypes, setModifierTypes] = useState<ModifierType[]>([]);
  const [battle, setBattle] = useState<BattleSnapshot>(emptyBattle);
  const [canSavePlayerStats, setCanSavePlayerStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [invokeOpen, setInvokeOpen] = useState(false);
  const [tactical, setTactical] = useState<CombatantTactical | null>(null);
  const [shareOrigin, setShareOrigin] = useState<string | null>(null);

  const applySnapshot = useCallback((snapshot: BattleSnapshot) => {
    setBattle(snapshot);
    if (typeof snapshot.canSavePlayerStats === 'boolean') {
      setCanSavePlayerStats(snapshot.canSavePlayerStats);
    }
    if (snapshot.message && (snapshot.isTestBattle || snapshot.status === 'Finished')) {
      setInfo(snapshot.message);
    } else if (snapshot.lastTickEvents && snapshot.lastTickEvents.length > 0) {
      const parts = snapshot.lastTickEvents.map((e) => {
        const sign = e.kind === 'Heal' ? '+' : '−';
        return (
          `${e.combatantName}: ${e.modifierName} ${sign}${e.amount}` +
          (e.rollDetail ? ` (${e.rollDetail})` : '')
        );
      });
      setInfo(`Efeitos: ${parts.join(' · ')}`);
    } else if (snapshot.lastDiceRoll != null) {
      setInfo(`Rolagem: ${snapshot.lastDiceRoll}`);
    }
  }, []);

  useBattleHub(battle.publicToken, applySnapshot, token);

  useEffect(() => {
    void (async () => {
      try {
        const [sheetList, current, types, origin] = await Promise.all([
          api.listSheets(),
          api.getCurrentBattle(),
          api.listModifierTypes(),
          fetchShareOrigin(),
        ]);
        setSheets(sheetList);
        setBattle(current);
        setCanSavePlayerStats(Boolean(current.canSavePlayerStats));
        setModifierTypes(types);
        setShareOrigin(origin);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Falha ao carregar batalha.');
      }
    })();
  }, []);

  useEffect(() => {
    if (!shouldRunTestBattleTicks(battle.status, battle.isTestBattle)) {
      return;
    }

    let cancelled = false;
    let inFlight = false;
    const id = window.setInterval(() => {
      if (cancelled || inFlight) return;
      inFlight = true;
      void api
        .tickTestBattle()
        .then((snapshot) => {
          if (!cancelled) applySnapshot(snapshot);
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof ApiError ? err.message : 'Falha na ação de combate.');
          }
        })
        .finally(() => {
          inFlight = false;
        });
    }, TEST_BATTLE_TICK_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [battle.status, battle.isTestBattle, applySnapshot]);

  async function run(action: () => Promise<BattleSnapshot>) {
    setError(null);
    const snapshot = await action();
    applySnapshot(snapshot);
    return snapshot;
  }

  async function handleBattleAction(action: () => Promise<BattleSnapshot>) {
    try {
      await run(action);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha na ação de combate.');
    }
  }

  async function openTactical(combatantId: string) {
    setError(null);
    try {
      setTactical(await api.getCombatantTactical(combatantId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar detalhes táticos.');
    }
  }

  async function handleSavePlayerStats() {
    if (
      !window.confirm(
        'Salvar vida atual e CA base das fichas player desta batalha? Criaturas não serão alteradas.',
      )
    ) {
      return;
    }

    try {
      const snapshot = await run(() => api.savePlayerStats());
      setCanSavePlayerStats(false);
      setInfo(snapshot.message ?? 'Estatísticas salvas.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao salvar estatísticas.');
    }
  }

  async function handleStartTestBattle() {
    const hasOpen =
      (battle.status === 'Preparing' || battle.status === 'Active') &&
      battle.combatants.length > 0;
    if (
      hasOpen &&
      !window.confirm(
        'Há um combate em andamento. Finalizar e iniciar a batalha teste (Guarda Veterano, Goblin e Lobo)?',
      )
    ) {
      return;
    }

    setCanSavePlayerStats(false);
    await handleBattleAction(() => api.startTestBattle());
  }

  async function handleInvoke(payload: InvokePayload) {
    setError(null);
    setCanSavePlayerStats(false);
    try {
      if (payload.type === 'Player') {
        try {
          await run(() => api.invokePlayer(payload.sheetId, payload.initiative, false));
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            const confirmDup = window.confirm(
              `${err.message}\nDeseja confirmar a invocação mesmo assim?`,
            );
            if (!confirmDup) {
              throw err;
            }
            await run(() => api.invokePlayer(payload.sheetId, payload.initiative, true));
            return;
          }
          throw err;
        }
        return;
      }

      await run(() =>
        api.invokeCreature({
          sheetId: payload.sheetId,
          initiative: payload.rollDice ? null : payload.initiative,
          rollDice: payload.rollDice,
          diceNotation: payload.rollDice ? payload.diceNotation : null,
          hideHpFromPublic: payload.hideHpFromPublic,
        }),
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Falha ao invocar.';
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  }

  const isPreparing = battle.status === 'Preparing';
  const isActive = battle.status === 'Active';
  const isTestBattle = Boolean(battle.isTestBattle);
  const publicUrl = resolvePublicBattleUrl(
    battle.publicToken,
    shareOrigin,
    window.location.origin,
  );

  return (
    <div className="battle-layout">
      <section className="panel battle-toolbar">
        <div className="battle-toolbar-main">
          <div>
            <h2>Combate</h2>
            <p className="muted toolbar-status">
              Status: <strong>{battle.status}</strong>
              {isTestBattle && ' · Simulação'}
              {battle.combatants.length > 0 && ` · ${battle.combatants.length} na fila`}
            </p>
          </div>
          <div className="row battle-toolbar-actions">
            <button
              type="button"
              disabled={!isPreparing || isTestBattle}
              onClick={() => void handleBattleAction(() => api.startBattle())}
            >
              Iniciar batalha
            </button>
            <button
              type="button"
              disabled={!isActive || isTestBattle}
              onClick={() => void handleBattleAction(() => api.nextTurn())}
            >
              Próximo
            </button>
            <button type="button" className="ghost" onClick={() => void handleStartTestBattle()}>
              Batalha teste
            </button>
            <button
              type="button"
              className="danger"
              disabled={!isPreparing && !isActive}
              onClick={() => void handleBattleAction(() => api.finishBattle())}
            >
              Finalizar
            </button>
            <button
              type="button"
              className="ghost"
              disabled={!canSavePlayerStats}
              title={
                canSavePlayerStats
                  ? 'Gravar vida e CA base nas fichas player'
                  : 'Finalize uma batalha com players para habilitar'
              }
              onClick={() => void handleSavePlayerStats()}
            >
              Salvar estatísticas
            </button>
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        {info && <p className="success">{info}</p>}

        {publicUrl && (
          <div className="public-link">
            <span>Link público</span>
            <a href={publicUrl} target="_blank" rel="noreferrer">
              {publicUrl}
            </a>
          </div>
        )}
      </section>

      <section className="panel battle-queue">
        <header className="queue-header">
          <h2>Fila de iniciativa</h2>
          <button type="button" disabled={isTestBattle} onClick={() => setInvokeOpen(true)}>
            Invocar
          </button>
        </header>

        {battle.combatants.length === 0 ? (
          <p className="muted">{battle.message ?? 'Nenhum combatente na fila.'}</p>
        ) : (
          <div className="combatant-grid">
            {battle.combatants.map((c) => (
              <CombatantCard
                key={c.id}
                combatant={c}
                modifierTypes={modifierTypes}
                onOpenTactical={(id) => void openTactical(id)}
                onDamage={(id, amount) =>
                  void handleBattleAction(() => api.applyDamage(id, amount))
                }
                onHeal={(id, amount) =>
                  void handleBattleAction(() => api.applyHeal(id, amount))
                }
                onKill={(id) => void handleBattleAction(() => api.kill(id))}
                onRevive={(id, healAmount) =>
                  void handleBattleAction(() => api.revive(id, healAmount))
                }
                onApplyModifier={(id, typeId, duration) =>
                  void handleBattleAction(() => api.applyModifier(id, typeId, duration))
                }
                onRemoveModifier={(modifierId) =>
                  void handleBattleAction(() => api.removeModifier(modifierId))
                }
              />
            ))}
          </div>
        )}
      </section>

      <InvokeModal
        open={invokeOpen}
        sheets={sheets}
        onClose={() => setInvokeOpen(false)}
        onInvoke={handleInvoke}
      />

      {tactical && <TacticalPanel data={tactical} onClose={() => setTactical(null)} />}
    </div>
  );
}
