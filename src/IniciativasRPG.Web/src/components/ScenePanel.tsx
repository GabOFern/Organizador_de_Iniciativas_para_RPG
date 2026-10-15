import * as signalR from '@microsoft/signalr';
import { useEffect, useId, useRef, useState } from 'react';
import { api, ApiError } from '../api';
import { SceneLightbox } from './SceneLightbox';
import { useAuth } from '../auth';
import {
  config,
  resolveApiUrl,
  sceneCancelEditLabel,
  sceneEditLabel,
  sceneEmptyMessage,
  sceneFilterAllLabel,
  sceneFilterKindLabel,
  sceneFilterNameLabel,
  sceneImageAccept,
  sceneImageMaxBytes,
  sceneImageSourceConflict,
  sceneImageSourceRequired,
  sceneImageUrlInvalid,
  sceneImageUrlMaxLength,
  sceneIncludeLabel,
  sceneKindDisplayLabel,
  sceneKindLabel,
  sceneKindOptions,
  sceneKindRequired,
  sceneKindUncategorizedLabel,
  sceneLauncherAriaLabel,
  sceneLauncherLabel,
  sceneSaveLabel,
  sceneTitleMaxLength,
  sceneTitleRequired,
  sceneTitleTooLong,
  sceneVisibilityHideLabel,
  sceneVisibilityShowLabel,
  sheetImageTooLarge,
  sheetImageTypeInvalid,
} from '../config';
import { filterScenes } from '../sceneFilters';
import {
  countUnseen,
  isSceneUnseen,
  loadSeenIds,
  markSceneSeen,
  reconcileSeenOnVisibleChange,
  saveSeenIds,
} from '../sceneSeen';
import type { CampaignScene, SceneKindFilter } from '../types';

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function EyeOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" aria-hidden focusable="false">
      <path
        d="M2 12C4.5 7 8.5 4.5 12 4.5S19.5 7 22 12C19.5 17 15.5 19.5 12 19.5S4.5 17 2 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" aria-hidden focusable="false">
      <path
        d="M3 9C5.5 12.5 8.5 14.5 12 14.5S18.5 12.5 21 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M4 18 L20 6" fill="none" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

type AssignableKind = (typeof sceneKindOptions)[number]['value'];

export function ScenePanel({
  publicToken,
  canEdit,
}: {
  publicToken: string;
  canEdit: boolean;
}) {
  const { token } = useAuth();
  const titleId = useId();
  const kindId = useId();
  const urlId = useId();
  const fileId = useId();
  const filterNameId = useId();
  const filterKindId = useId();
  const [scenes, setScenes] = useState<CampaignScene[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(() =>
    canEdit ? new Set() : loadSeenIds(publicToken),
  );
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState<CampaignScene | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<AssignableKind | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [filterName, setFilterName] = useState('');
  const [filterKind, setFilterKind] = useState<SceneKindFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hubToken = canEdit ? token : null;
  const prevVisibleIdsRef = useRef<string[]>([]);
  const hasLoadedPublicRef = useRef(false);

  function applyScenes(list: CampaignScene[]) {
    if (!canEdit) {
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
    setScenes(list);
  }

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setKind('');
    setImageUrl('');
    setFile(null);
    setFileKey((key) => key + 1);
  }

  function startEdit(scene: CampaignScene) {
    setEditingId(scene.id);
    setTitle(scene.title);
    setKind(
      scene.kind === 'Uncategorized' ? '' : (scene.kind as AssignableKind),
    );
    setImageUrl('');
    setFile(null);
    setFileKey((key) => key + 1);
    setError(null);
  }

  useEffect(() => {
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
  }, [publicToken, canEdit]);

  useEffect(() => {
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

  function validateForm(requireImage: boolean): {
    trimmedTitle: string;
    trimmedUrl: string;
    selectedKind: AssignableKind;
  } | null {
    const trimmedTitle = title.trim();
    const trimmedUrl = imageUrl.trim();
    if (!trimmedTitle) {
      setError(sceneTitleRequired);
      return null;
    }
    if (trimmedTitle.length > sceneTitleMaxLength) {
      setError(sceneTitleTooLong);
      return null;
    }
    if (!kind) {
      setError(sceneKindRequired);
      return null;
    }
    if (trimmedUrl && file) {
      setError(sceneImageSourceConflict);
      return null;
    }
    if (requireImage && !trimmedUrl && !file) {
      setError(sceneImageSourceRequired);
      return null;
    }
    if (trimmedUrl && (trimmedUrl.length > sceneImageUrlMaxLength || !isHttpUrl(trimmedUrl))) {
      setError(sceneImageUrlInvalid);
      return null;
    }
    if (file && file.size > sceneImageMaxBytes) {
      setError(sheetImageTooLarge);
      return null;
    }
    if (file?.type && !sceneImageAccept.split(',').includes(file.type)) {
      setError(sheetImageTypeInvalid);
      return null;
    }
    return { trimmedTitle, trimmedUrl, selectedKind: kind };
  }

  async function submitForm() {
    const isEdit = editingId !== null;
    const validated = validateForm(!isEdit);
    if (!validated) return;

    setBusy(true);
    setError(null);
    try {
      const payload = {
        title: validated.trimmedTitle,
        kind: validated.selectedKind,
        imageUrl: validated.trimmedUrl || undefined,
        file: file ?? undefined,
      };
      const list = isEdit
        ? await api.updateScene(editingId, payload)
        : await api.createScene(payload);
      applyScenes(list);
      resetForm();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : isEdit
            ? 'Falha ao salvar imagem.'
            : 'Falha ao incluir imagem.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeScene(scene: CampaignScene) {
    setBusy(true);
    setError(null);
    try {
      const list = await api.deleteScene(scene.id);
      applyScenes(list);
      if (focused?.id === scene.id) setFocused(null);
      if (editingId === scene.id) resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao remover imagem.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisibility(scene: CampaignScene) {
    setBusy(true);
    setError(null);
    try {
      const list = await api.setSceneVisibility(scene.id, !scene.isVisibleToPlayers);
      applyScenes(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao alterar visibilidade.');
    } finally {
      setBusy(false);
    }
  }

  function openScene(scene: CampaignScene) {
    setFocused(scene);
    if (!canEdit) {
      const next = markSceneSeen(publicToken, scene.id);
      setSeenIds(next);
    }
  }

  const visibleScenes = canEdit
    ? filterScenes(scenes, { nameQuery: filterName, kind: filterKind })
    : scenes;

  const unseenCount = canEdit
    ? 0
    : countUnseen(
        scenes.map((scene) => scene.id),
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

          {canEdit && scenes.length > 0 && (
            <div className="scene-filters">
              <label htmlFor={filterNameId}>
                {sceneFilterNameLabel}
                <input
                  id={filterNameId}
                  value={filterName}
                  onChange={(event) => setFilterName(event.target.value)}
                />
              </label>
              <label htmlFor={filterKindId}>
                {sceneFilterKindLabel}
                <select
                  id={filterKindId}
                  value={filterKind}
                  onChange={(event) => setFilterKind(event.target.value as SceneKindFilter)}
                >
                  <option value="all">{sceneFilterAllLabel}</option>
                  <option value="Uncategorized">{sceneKindUncategorizedLabel}</option>
                  {sceneKindOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {scenes.length === 0 && !error ? (
            <p>{sceneEmptyMessage}</p>
          ) : visibleScenes.length === 0 ? (
            canEdit ? <p>{sceneEmptyMessage}</p> : null
          ) : (
            <ul className="scene-list">
              {visibleScenes.map((scene) => {
                const unread = !canEdit && isSceneUnseen(scene.id, seenIds);
                const rowClass = [
                  'scene-row',
                  canEdit ? 'scene-row-master' : '',
                  unread ? 'scene-row-unread' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <li key={scene.id} className={rowClass}>
                    <button type="button" className="scene-open" onClick={() => openScene(scene)}>
                      <img src={resolveApiUrl(scene.imageUrl)} alt="" />
                      <span className="scene-open-text">
                        {canEdit && (
                          <span className="scene-kind">{sceneKindDisplayLabel(scene.kind)}</span>
                        )}
                        <span>{scene.title}</span>
                      </span>
                    </button>
                    {canEdit && (
                      <div className="scene-row-actions">
                        <button
                          type="button"
                          className={
                            scene.isVisibleToPlayers
                              ? 'ghost scene-visibility scene-visibility-on'
                              : 'ghost scene-visibility scene-visibility-off'
                          }
                          disabled={busy}
                          aria-label={
                            scene.isVisibleToPlayers
                              ? sceneVisibilityHideLabel
                              : sceneVisibilityShowLabel
                          }
                          aria-pressed={scene.isVisibleToPlayers}
                          onClick={() => void toggleVisibility(scene)}
                        >
                          {scene.isVisibleToPlayers ? <EyeOpenIcon /> : <EyeClosedIcon />}
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          disabled={busy}
                          onClick={() => startEdit(scene)}
                        >
                          {sceneEditLabel}
                        </button>
                        <button
                          type="button"
                          className="ghost danger"
                          disabled={busy}
                          onClick={() => void removeScene(scene)}
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {canEdit && (
            <form
              className="scene-form"
              onSubmit={(event) => {
                event.preventDefault();
                void submitForm();
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
              <label htmlFor={kindId}>
                {sceneKindLabel}
                <select
                  id={kindId}
                  value={kind}
                  required
                  onChange={(event) => setKind(event.target.value as AssignableKind | '')}
                >
                  <option value="" disabled>
                    {sceneKindRequired}
                  </option>
                  {sceneKindOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor={urlId}>
                Link da imagem
                <input
                  id={urlId}
                  value={imageUrl}
                  maxLength={sceneImageUrlMaxLength}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder={editingId ? 'Deixe vazio para manter' : undefined}
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
              <div className="scene-form-actions">
                <button type="submit" disabled={busy}>
                  {editingId ? sceneSaveLabel : sceneIncludeLabel}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="ghost"
                    disabled={busy}
                    onClick={() => {
                      resetForm();
                      setError(null);
                    }}
                  >
                    {sceneCancelEditLabel}
                  </button>
                )}
              </div>
            </form>
          )}
        </aside>
      )}

      {focused && <SceneLightbox scene={focused} onClose={() => setFocused(null)} />}
    </>
  );
}
