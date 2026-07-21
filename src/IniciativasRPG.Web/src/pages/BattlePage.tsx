import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import { CombatantCard } from '../components/CombatantCard';
import { InvokeModal, type InvokePayload } from '../components/InvokeModal';
import { routes } from '../config';
import { useBattleHub } from '../hooks/useBattleHub';
import type { BattleSnapshot, ModifierType, Sheet } from '../types';

const emptyBattle: BattleSnapshot = {
  id: null,
  publicToken: null,
  status: 'Finished',
  currentTurnIndex: 0,
  combatants: [],
  message: null,
  lastDiceRoll: null,
};

export function BattlePage() {
  const { token } = useAuth();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [modifierTypes, setModifierTypes] = useState<ModifierType[]>([]);
  const [battle, setBattle] = useState<BattleSnapshot>(emptyBattle);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [invokeOpen, setInvokeOpen] = useState(false);

  const applySnapshot = useCallback((snapshot: BattleSnapshot) => {
    setBattle(snapshot);
    if (snapshot.lastDiceRoll != null) {
      setInfo(`Rolagem: ${snapshot.lastDiceRoll}`);
    }
  }, []);

  useBattleHub(battle.publicToken, applySnapshot, token);

  useEffect(() => {
    void (async () => {
      try {
        const [sheetList, current, types] = await Promise.all([
          api.listSheets(),
          api.getCurrentBattle(),
          api.listModifierTypes(),
        ]);
        setSheets(sheetList);
        setBattle(current);
        setModifierTypes(types);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Falha ao carregar batalha.');
      }
    })();
  }, []);

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

  async function handleInvoke(payload: InvokePayload) {
    setError(null);
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
  const publicUrl =
    battle.publicToken != null
      ? `${window.location.origin}${routes.publicBattle(battle.publicToken)}`
      : null;

  return (
    <div className="battle-layout">
      <section className="panel battle-toolbar">
        <div className="battle-toolbar-main">
          <div>
            <h2>Combate</h2>
            <p className="muted toolbar-status">
              Status: <strong>{battle.status}</strong>
              {battle.combatants.length > 0 && ` · ${battle.combatants.length} na fila`}
            </p>
          </div>
          <div className="row battle-toolbar-actions">
            <button
              type="button"
              disabled={!isPreparing}
              onClick={() => void handleBattleAction(() => api.startBattle())}
            >
              Iniciar batalha
            </button>
            <button
              type="button"
              disabled={!isActive}
              onClick={() => void handleBattleAction(() => api.nextTurn())}
            >
              Próximo
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
              disabled
              title="Disponível na Fase 3 (ST-020)"
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
          <button type="button" onClick={() => setInvokeOpen(true)}>
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
    </div>
  );
}
