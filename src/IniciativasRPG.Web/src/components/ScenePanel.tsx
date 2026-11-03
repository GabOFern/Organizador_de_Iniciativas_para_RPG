import * as signalR from '@microsoft/signalr';
import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api';
import { useSceneImageSrc } from '../sceneImage';
import { SceneLightbox } from './SceneLightbox';
import { useAuth } from '../auth';
import {
  config,
  sceneEmptyMessage,
  sceneLauncherAriaLabel,
  sceneLauncherLabel,
} from '../config';
import {
  countUnseen,
  isSceneUnseen,
  loadSeenIds,
  markSceneSeen,
  reconcileSeenOnVisibleChange,
  saveSeenIds,
} from '../sceneSeen';
import type { CampaignScene } from '../types';

function visibleToPlayers(list: CampaignScene[]) {
  return list.filter((scene) => scene.isVisibleToPlayers);
}

function SceneThumb({ url }: { url: string }) {
  const src = useSceneImageSrc(url);
  if (!src) return null;
  return <img src={src} alt="" />;
}

export function ScenePanel({
  publicToken,
  canEdit,
  scenes: scenesFromParent,
  onScenesChange,
}: {
  publicToken: string;
  /** true: lista completa do mestre, filtrada no drawer. false: lista pública, visto e hub do jogador. */
  canEdit: boolean;
  /** `null` = o pai ainda não recebeu a lista. Array = lista controlada. Omitir = o painel busca sozinho. */
  scenes?: CampaignScene[] | null;
  onScenesChange?: (scenes: CampaignScene[]) => void;
}) {
  const { token } = useAuth();
  const scenesControlled = !canEdit && scenesFromParent !== undefined;
  const [scenesState, setScenesState] = useState<CampaignScene[]>([]);
  const scenes = scenesControlled ? (scenesFromParent ?? []) : scenesState;
  const [seenIds, setSeenIds] = useState<Set<string>>(() =>
    canEdit ? new Set() : loadSeenIds(publicToken),
  );
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState<CampaignScene | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hubToken = canEdit ? token : null;
  const prevVisibleIdsRef = useRef<string[]>([]);
  const hasLoadedPublicRef = useRef(false);
  const seenTokenRef = useRef(publicToken);

  if (!canEdit && seenTokenRef.current !== publicToken) {
    seenTokenRef.current = publicToken;
    hasLoadedPublicRef.current = false;
    prevVisibleIdsRef.current = [];
    setSeenIds(loadSeenIds(publicToken));
  }

  function syncPublicSeen(list: CampaignScene[]) {
    const nextIds = list.map((scene) => scene.id);
    if (hasLoadedPublicRef.current) {
      setSeenIds((prevSeen) => {
        const reconciled = reconcileSeenOnVisibleChange(
          prevVisibleIdsRef.current,
          nextIds,
          prevSeen,
        );
        saveSeenIds(publicToken, reconciled);
        return reconciled;
      });
    } else {
      hasLoadedPublicRef.current = true;
      setSeenIds(loadSeenIds(publicToken));
    }
    prevVisibleIdsRef.current = nextIds;
  }

  function applyScenes(list: CampaignScene[]) {
    if (!canEdit) {
      syncPublicSeen(visibleToPlayers(list));
    }
    if (scenesControlled) {
      onScenesChange?.(list);
      return;
    }
    setScenesState(list);
  }

  useEffect(() => {
    if (!scenesControlled || scenesFromParent == null) return;
    syncPublicSeen(visibleToPlayers(scenesFromParent));
  }, [scenesControlled, scenesFromParent, publicToken]);

  useEffect(() => {
    if (scenesControlled) return;
    let cancelled = false;
    const load = canEdit ? api.listScenes() : api.listPublicScenes(publicToken);
    void load
      .then((list) => {
        if (!cancelled) applyScenes(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Falha ao carregar imagens.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [publicToken, canEdit, scenesControlled]);

  useEffect(() => {
    if (scenesControlled) return;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(config.hubUrl, {
        accessTokenFactory: hubToken ? () => hubToken : undefined,
      })
      .withAutomaticReconnect()
      .build();

    connection.on('ScenesUpdated', (list: CampaignScene[]) => {
      applyScenes(list);
    });

    let cancelled = false;
    const joinMethod = hubToken ? 'JoinBattleMaster' : 'JoinBattle';

    (async () => {
      try {
        await connection.start();
        if (!cancelled) {
          await connection.invoke(joinMethod, publicToken);
        }
      } catch (err) {
        console.error('Falha ao conectar nas imagens da sessão', err);
      }
    })();

    return () => {
      cancelled = true;
      connection.off('ScenesUpdated');
      void connection.stop();
    };
  }, [publicToken, hubToken, scenesControlled]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (focused) {
        setFocused(null);
        return;
      }
      if (open) setOpen(false);
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focused, open]);

  function openScene(scene: CampaignScene) {
    setFocused(scene);
    if (!canEdit) {
      const next = markSceneSeen(publicToken, scene.id);
      setSeenIds(next);
    }
  }

  const visibleScenes = visibleToPlayers(scenes);

  const unseenCount = canEdit
    ? 0
    : countUnseen(
        visibleScenes.map((scene) => scene.id),
        seenIds,
      );
  const launcherText =
    !canEdit && unseenCount > 0
      ? `${sceneLauncherLabel} (${unseenCount})`
      : sceneLauncherLabel;

  return (
    <>
      {!open && (
        <button
          type="button"
          className="scene-launcher"
          aria-label={sceneLauncherAriaLabel(unseenCount)}
          onClick={() => setOpen(true)}
        >
          {launcherText}
        </button>
      )}

      {open && (
        <aside className="scene-drawer" role="dialog" aria-label={sceneLauncherLabel}>
          <div className="scene-drawer-head">
            <h2>{sceneLauncherLabel}</h2>
            <button type="button" className="ghost" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>

          {error && <p className="error">{error}</p>}

          {visibleScenes.length === 0 && !error ? (
            <p>{sceneEmptyMessage}</p>
          ) : visibleScenes.length > 0 ? (
            <ul className="scene-list">
              {visibleScenes.map((scene) => {
                const unread = !canEdit && isSceneUnseen(scene.id, seenIds);
                const rowClass = ['scene-row', unread ? 'scene-row-unread' : '']
                  .filter(Boolean)
                  .join(' ');
                return (
                  <li key={scene.id} className={rowClass}>
                    <button type="button" className="scene-open" onClick={() => openScene(scene)}>
                      <SceneThumb url={scene.imageUrl} />
                      <span className="scene-open-text">
                        <span>{scene.title}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </aside>
      )}

      {focused && <SceneLightbox scene={focused} onClose={() => setFocused(null)} />}
    </>
  );
}
