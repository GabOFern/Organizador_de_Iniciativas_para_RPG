import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

interface ImageFocusPreviewProps {
  imageUrl: string;
  focusX: number;
  focusY: number;
  onChange: (focusX: number, focusY: number) => void;
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

/**
 * Preview no mesmo aspect-ratio do card (16/10).
 * Arrastar move o object-position (ponto de foco).
 */
export function ImageFocusPreview({ imageUrl, focusX, focusY, onChange }: ImageFocusPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);

  const url = imageUrl.trim();

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!url) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: focusX,
      originY: focusY,
    };
    setDragging(true);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || !frame) return;

    const rect = frame.getBoundingClientRect();
    // Arrastar a imagem: mover o dedo para cima = foco sobe (mostra topo)
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;
    onChange(clamp(drag.originX - dx), clamp(drag.originY - dy));
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current) {
      dragRef.current = null;
      setDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }
  }

  return (
    <div className="image-focus-field">
      <span className="image-focus-label">Enquadramento no card</span>
      <div
        ref={frameRef}
        className={['image-focus-preview', dragging ? 'is-dragging' : '', !url ? 'is-empty' : '']
          .filter(Boolean)
          .join(' ')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="presentation"
      >
        {url ? (
          <img
            src={url}
            alt=""
            draggable={false}
            style={{ objectPosition: `${focusX}% ${focusY}%` }}
          />
        ) : (
          <div className="image-focus-placeholder">Cole uma URL de imagem acima</div>
        )}
        {url && <span className="image-focus-crosshair" aria-hidden />}
      </div>
      <p className="muted image-focus-hint">
        Arraste para enquadrar a parte que aparece no card (ex.: rosto em vez do torso).
      </p>
    </div>
  );
}
