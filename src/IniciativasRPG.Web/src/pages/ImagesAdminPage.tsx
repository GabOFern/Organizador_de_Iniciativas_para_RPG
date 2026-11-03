import { useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { SceneLightbox } from '../components/SceneLightbox';
import {
  imageExceedsUploadLimit,
  imagesLoadFailedMessage,
  imagesNavLabel,
  sceneCancelEditLabel,
  sceneCreateFailedMessage,
  sceneDeleteFailedMessage,
  sceneDeleteLabel,
  sceneEditLabel,
  sceneEditorCloseLabel,
  sceneEditorHeading,
  sceneEditorSubmitLabel,
  sceneEmptyMessage,
  sceneFilterAllLabel,
  sceneFilterEmptyMessage,
  sceneFilterExcludeTagsLabel,
  sceneFilterKindLabel,
  sceneFilterNameLabel,
  sceneFilterTagModeAndLabel,
  sceneFilterTagModeLabel,
  sceneFilterTagModeOrLabel,
  sceneFilterTagsLabel,
  sceneImageAccept,
  sceneImageFileLabel,
  sceneImageSheetLabel,
  sceneImageSheetNoneLabel,
  sceneImageSourceConflict,
  sceneImageSourceRequired,
  sceneImageUrlLabel,
  sceneImageUrlInvalid,
  sceneImageUrlMaxLength,
  sceneKindDisplayLabel,
  sceneKindLabel,
  sceneKindOptions,
  sceneKindRequired,
  sceneKindUncategorizedLabel,
  sceneNewLabel,
  sceneNewTagLabel,
  sceneCreateTagLabel,
  sceneTagCreateFailedMessage,
  sceneTagNameRequired,
  sceneTagsLabel,
  sceneSaveFailedMessage,
  sceneTitleMaxLength,
  sceneTitleRequired,
  sceneTitleTooLong,
  sceneVisibilityFailedMessage,
  sceneVisibilityToggleLabel,
  sheetImageTooLarge,
  sheetImageTypeInvalid,
} from '../config';
import { useSceneImageSrc } from '../sceneImage';
import { filterGalleryItems, type GalleryTagMode } from '../galleryFilters';
import type { CampaignImageTag, CampaignScene, SceneKindFilter, Sheet } from '../types';

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

type AssignableKind = (typeof sceneKindOptions)[number]['value'];

function selectedValues(select: HTMLSelectElement): string[] {
  return Array.from(select.selectedOptions, (option) => option.value);
}

function SceneThumb({ url }: { url: string }) {
  const src = useSceneImageSrc(url);
  if (!src) return null;
  return <img src={src} alt="" />;
}

export function ImagesAdminPage() {
  const [scenes, setScenes] = useState<CampaignScene[]>([]);
  const [tags, setTags] = useState<CampaignImageTag[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [focused, setFocused] = useState<CampaignScene | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<AssignableKind | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sheetId, setSheetId] = useState('');
  const [fileKey, setFileKey] = useState(0);
  const [filterName, setFilterName] = useState('');
  const [filterKind, setFilterKind] = useState<SceneKindFilter>('all');
  const [filterTagMode, setFilterTagMode] = useState<GalleryTagMode>('and');
  const [includeTagIds, setIncludeTagIds] = useState<string[]>([]);
  const [excludeTagIds, setExcludeTagIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function resetForm() {
    setEditorOpen(false);
    setEditingId(null);
    setTitle('');
    setKind('');
    setImageUrl('');
    setFile(null);
    setSheetId('');
    setSelectedTagIds([]);
    setNewTagName('');
    setFileKey((key) => key + 1);
  }

  function closeEditor() {
    resetForm();
    setError(null);
  }

  function openCreate() {
    resetForm();
    setEditorOpen(true);
    setError(null);
  }

  function startEdit(scene: CampaignScene) {
    setEditingId(scene.id);
    setTitle(scene.title);
    setKind(scene.kind === 'Uncategorized' ? '' : (scene.kind as AssignableKind));
    setImageUrl('');
    setFile(null);
    setSheetId(scene.sheetId ?? '');
    setSelectedTagIds((scene.tags ?? []).map((tag) => tag.id));
    setNewTagName('');
    setFileKey((key) => key + 1);
    setEditorOpen(true);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([api.listScenes(), api.listSceneTags(), api.listSheets()])
      .then(([sceneList, tagList, sheetList]) => {
        if (!cancelled) {
          setScenes(sceneList);
          setTags(tagList);
          setSheets(sheetList);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : imagesLoadFailedMessage);
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!editorOpen && !focused) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (focused) {
        setFocused(null);
        return;
      }
      closeEditor();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editorOpen, focused]);

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
    const sourceCount = Number(Boolean(trimmedUrl)) + Number(Boolean(file)) + Number(Boolean(sheetId));
    if (sourceCount > 1) {
      setError(sceneImageSourceConflict);
      return null;
    }
    if (requireImage && sourceCount === 0) {
      setError(sceneImageSourceRequired);
      return null;
    }
    if (trimmedUrl && (trimmedUrl.length > sceneImageUrlMaxLength || !isHttpUrl(trimmedUrl))) {
      setError(sceneImageUrlInvalid);
      return null;
    }
    if (file && imageExceedsUploadLimit(file.size)) {
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
        sheetId: sheetId || undefined,
        tagIds: selectedTagIds,
      };
      const list = isEdit
        ? await api.updateScene(editingId, payload)
        : await api.createScene(payload);
      setScenes(list);
      resetForm();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : isEdit ? sceneSaveFailedMessage : sceneCreateFailedMessage,
      );
    } finally {
      setBusy(false);
    }
  }

  async function createTag() {
    const name = newTagName.trim();
    if (!name) {
      setError(sceneTagNameRequired);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const tag = await api.createSceneTag(name);
      setTags((current) =>
        current.some((entry) => entry.id === tag.id)
          ? current
          : [...current, tag].sort((left, right) => left.name.localeCompare(right.name)),
      );
      setSelectedTagIds((current) => (current.includes(tag.id) ? current : [...current, tag.id]));
      setNewTagName('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : sceneTagCreateFailedMessage);
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
      if (editingId === scene.id) resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : sceneDeleteFailedMessage);
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisibility(scene: CampaignScene) {
    setBusy(true);
    setError(null);
    try {
      const list = await api.setSceneVisibility(scene.id, !scene.isVisibleToPlayers);
      setScenes(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : sceneVisibilityFailedMessage);
    } finally {
      setBusy(false);
    }
  }

  const visibleScenes = filterGalleryItems(scenes, {
    nameQuery: filterName,
    category: filterKind,
    tagMode: filterTagMode,
    includeTagIds,
    excludeTagIds,
  });

  return (
    <section className="panel">
      <div className="queue-header">
        <h2>{imagesNavLabel}</h2>
        <button type="button" disabled={busy} onClick={openCreate}>
          {sceneNewLabel}
        </button>
      </div>

      {error && !editorOpen && <p className="error">{error}</p>}

      {loaded && scenes.length > 0 && (
        <div className="images-admin-filters">
          <label className="images-admin-filter-name">
            {sceneFilterNameLabel}
            <input value={filterName} onChange={(event) => setFilterName(event.target.value)} />
          </label>
          <label>
            {sceneFilterTagsLabel}
            <select
              multiple
              value={includeTagIds}
              onChange={(event) => setIncludeTagIds(selectedValues(event.currentTarget))}
            >
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {sceneFilterKindLabel}
            <select
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
          <label>
            {sceneFilterTagModeLabel}
            <select
              value={filterTagMode}
              onChange={(event) => setFilterTagMode(event.target.value as GalleryTagMode)}
            >
              <option value="and">{sceneFilterTagModeAndLabel}</option>
              <option value="or">{sceneFilterTagModeOrLabel}</option>
            </select>
          </label>
          <label>
            {sceneFilterExcludeTagsLabel}
            <select
              multiple
              value={excludeTagIds}
              onChange={(event) => setExcludeTagIds(selectedValues(event.currentTarget))}
            >
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {!loaded ? null : scenes.length === 0 ? (
        error ? null : <p className="muted">{sceneEmptyMessage}</p>
      ) : visibleScenes.length === 0 ? (
        <p className="muted">{sceneFilterEmptyMessage}</p>
      ) : (
        <ul className="images-admin-list">
          {visibleScenes.map((scene) => (
            <li key={scene.id} className="images-admin-item">
              <button type="button" className="scene-open" onClick={() => setFocused(scene)}>
                <SceneThumb url={scene.imageUrl} />
                <span className="scene-open-text">
                  <span>{scene.title}</span>
                </span>
              </button>
              <div className="images-admin-meta">
                <span className="scene-kind">{sceneKindDisplayLabel(scene.kind)}</span>
                <button
                  type="button"
                  className="ghost images-admin-visibility"
                  disabled={busy}
                  aria-pressed={scene.isVisibleToPlayers}
                  onClick={() => void toggleVisibility(scene)}
                >
                  {sceneVisibilityToggleLabel}
                </button>
              </div>
              {(scene.tags?.length ?? 0) > 0 && (
                <ul className="images-admin-tags" aria-label={sceneTagsLabel}>
                  {(scene.tags ?? []).map((tag) => (
                    <li key={tag.id}>{tag.name}</li>
                  ))}
                </ul>
              )}
              <div className="row">
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
                  {sceneDeleteLabel}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editorOpen && (
        <div className="modal-backdrop scene-editor-backdrop" role="presentation" onClick={closeEditor}>
          <div
            className="modal-panel panel"
            role="dialog"
            aria-modal="true"
            aria-label={sceneEditorHeading(editingId !== null)}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <h2>{sceneEditorHeading(editingId !== null)}</h2>
              <button type="button" className="ghost" onClick={closeEditor} aria-label={sceneEditorCloseLabel}>
                Fechar
              </button>
            </header>
            {error && <p className="error">{error}</p>}
            <form
              className="scene-form"
              onSubmit={(event) => {
                event.preventDefault();
                void submitForm();
              }}
            >
              <label>
                Título
                <input
                  value={title}
                  maxLength={sceneTitleMaxLength}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label>
                {sceneKindLabel}
                <select
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
              <label>
                {sceneImageSheetLabel}
                <select
                  value={sheetId}
                  onChange={(event) => {
                    const next = event.target.value;
                    setSheetId(next);
                    if (next) {
                      setImageUrl('');
                      setFile(null);
                      setFileKey((key) => key + 1);
                    }
                  }}
                >
                  <option value="">{sceneImageSheetNoneLabel}</option>
                  {sheets.map((sheet) => (
                    <option key={sheet.id} value={sheet.id}>
                      {sheet.name}
                    </option>
                  ))}
                </select>
              </label>
              {!sheetId && (
                <>
                  <label>
                    {sceneImageUrlLabel}
                    <input
                      value={imageUrl}
                      maxLength={sceneImageUrlMaxLength}
                      onChange={(event) => setImageUrl(event.target.value)}
                      placeholder={editingId ? 'Deixe vazio para manter' : undefined}
                    />
                  </label>
                  <label>
                    {sceneImageFileLabel}
                    <input
                      key={fileKey}
                      type="file"
                      accept={sceneImageAccept}
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </>
              )}
              <label>
                {sceneTagsLabel}
                <select
                  multiple
                  value={selectedTagIds}
                  onChange={(event) => setSelectedTagIds(selectedValues(event.currentTarget))}
                >
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="scene-new-tag">
                <label>
                  {sceneNewTagLabel}
                  <input
                    value={newTagName}
                    onChange={(event) => setNewTagName(event.target.value)}
                  />
                </label>
                <button type="button" className="ghost" disabled={busy} onClick={() => void createTag()}>
                  {sceneCreateTagLabel}
                </button>
              </div>
              <div className="scene-form-actions">
                <button type="submit" disabled={busy}>
                  {sceneEditorSubmitLabel(editingId !== null)}
                </button>
                <button type="button" className="ghost" disabled={busy} onClick={closeEditor}>
                  {sceneCancelEditLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {focused && <SceneLightbox scene={focused} onClose={() => setFocused(null)} />}
    </section>
  );
}
