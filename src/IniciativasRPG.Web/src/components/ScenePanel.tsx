import * as signalR from '@microsoft/signalr';
import { useEffect, useId, useState } from 'react';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import {
  config,
  resolveApiUrl,
  sceneEmptyMessage,
  sceneImageAccept,
  sceneImageMaxBytes,
  sceneImageSourceConflict,
  sceneImageSourceRequired,
  sceneImageUrlInvalid,
  sceneImageUrlMaxLength,
  sceneTitleMaxLength,
  sceneTitleRequired,
  sceneTitleTooLong,
  sheetImageTooLarge,
  sheetImageTypeInvalid,
} from '../config';
import type { CampaignScene } from '../types';

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ScenePanel({
  publicToken,
  canEdit,
}: {
  publicToken: string;
  canEdit: boolean;
}) {
  const { token } = useAuth();
  const titleId = useId();
  const urlId = useId();
  const fileId = useId();
  const [scenes, setScenes] = useState<CampaignScene[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState<CampaignScene | null>(null);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hubToken = canEdit ? token : null;

  useEffect(() => {
    let cancelled = false;
    const load = canEdit ? api.listScenes() : api.listPublicScenes(publicToken);
    void load
      .then((list) => {
        if (!cancelled) setScenes(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Falha ao carregar imagens.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [publicToken, canEdit]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(config.hubUrl, {
        accessTokenFactory: hubToken ? () => hubToken : undefined,
      })
      .withAutomaticReconnect()
      .build();

    connection.on('ScenesUpdated', (list: CampaignScene[]) => {
      setScenes(list);
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
  }, [publicToken, hubToken]);

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

  async function includeScene() {
    const trimmedTitle = title.trim();
    const trimmedUrl = imageUrl.trim();
    if (!trimmedTitle) {
      setError(sceneTitleRequired);
      return;
    }
    if (trimmedTitle.length > sceneTitleMaxLength) {
      setError(sceneTitleTooLong);
      return;
    }
    if (trimmedUrl && file) {
      setError(sceneImageSourceConflict);
      return;
    }
    if (!trimmedUrl && !file) {
      setError(sceneImageSourceRequired);
      return;
    }
    if (trimmedUrl && (trimmedUrl.length > sceneImageUrlMaxLength || !isHttpUrl(trimmedUrl))) {
      setError(sceneImageUrlInvalid);
      return;
    }
    if (file && file.size > sceneImageMaxBytes) {
      setError(sheetImageTooLarge);
      return;
    }
    if (file?.type && !sceneImageAccept.split(',').includes(file.type)) {
      setError(sheetImageTypeInvalid);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const list = await api.createScene({
        title: trimmedTitle,
        imageUrl: trimmedUrl || undefined,
        file: file ?? undefined,
      });
      setScenes(list);
      setTitle('');
      setImageUrl('');
      setFile(null);
      setFileKey((key) => key + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao incluir imagem.');
    } finally {
      setBusy(false);
    }
  }

  async function removeScene(scene: CampaignScene) {
    setBusy(true);
    setError(null);
    try {
      const list = await api.deleteScene(scene.id);
      setScenes(list);
      if (focused?.id === scene.id) setFocused(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao remover imagem.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button type="button" className="scene-launcher" onClick={() => setOpen(true)}>
          Imagens
        </button>
      )}

      {open && (
        <aside className="scene-drawer" role="dialog" aria-label="Imagens">
          <div className="scene-drawer-head">
            <h2>Imagens</h2>
            <button type="button" className="ghost" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>

          {error && <p className="error">{error}</p>}

          {scenes.length === 0 && !error ? (
            <p>{sceneEmptyMessage}</p>
          ) : scenes.length === 0 ? null : (
            <ul className="scene-list">
              {scenes.map((scene) => (
                <li key={scene.id} className="scene-row">
                  <button type="button" className="scene-open" onClick={() => setFocused(scene)}>
                    <img src={resolveApiUrl(scene.imageUrl)} alt="" />
                    <span>{scene.title}</span>
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      className="ghost danger"
                      disabled={busy}
                      onClick={() => void removeScene(scene)}
                    >
                      Remover
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canEdit && (
            <form
              className="scene-form"
              onSubmit={(event) => {
                event.preventDefault();
                void includeScene();
              }}
            >
              <label htmlFor={titleId}>
                Título
                <input
                  id={titleId}
                  value={title}
                  maxLength={sceneTitleMaxLength}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label htmlFor={urlId}>
                Link da imagem
                <input
                  id={urlId}
                  value={imageUrl}
                  maxLength={sceneImageUrlMaxLength}
                  onChange={(event) => setImageUrl(event.target.value)}
                />
              </label>
              <label htmlFor={fileId}>
                Arquivo da imagem
                <input
                  id={fileId}
                  key={fileKey}
                  type="file"
                  accept={sceneImageAccept}
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <button type="submit" disabled={busy}>
                Incluir
              </button>
            </form>
          )}
        </aside>
      )}

      {focused && (
        <div className="scene-lightbox" role="dialog" aria-modal="true" aria-label={focused.title}>
          <button type="button" onClick={() => setFocused(null)}>
            Fechar imagem
          </button>
          <img src={resolveApiUrl(focused.imageUrl)} alt={focused.title} />
        </div>
      )}
    </>
  );
}
