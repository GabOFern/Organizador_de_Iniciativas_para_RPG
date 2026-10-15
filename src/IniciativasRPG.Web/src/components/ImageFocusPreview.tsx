import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  resolveApiUrl,
  sheetImageFocusCenter,
  sheetImageScaleDefault,
  sheetImageScaleMax,
  sheetImageScaleMin,
  sheetImageScaleStep,
  sheetImageScaleWheelDivisor,
} from '../config';
import {
  atSheetImageScaleMax,
  clampFocus,
  focusAfterDrag,
  isWholeImage,
  sheetImageBox,
  useSheetImageFrame,
  wholeImageScale,
  framedImageStyle,
} from '../sheetImageFrame';

interface ImageFocusPreviewProps {
  imageUrl: string;
  focusX: number;
  focusY: number;
  scale: number;
  onChange: (focusX: number, focusY: number, scale: number) => void;
}

const scaleSlack = 0.001;

/**
 * Preview no mesmo aspect-ratio do card (16/10).
 * Arrastar move o ponto de foco. A escala 1 preenche o card; menor mostra a imagem inteira.
 */
export function ImageFocusPreview({
  imageUrl,
  focusX,
  focusY,
  scale,
  onChange,
}: ImageFocusPreviewProps) {
  const url = imageUrl.trim();
  const { frameRef, natural, naturalRef, frame, frameSizeRef, setNatural } = useSheetImageFrame(url);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);
  const scaleRef = useRef(scale);
  const focusRef = useRef({ x: focusX, y: focusY });
  const onChangeRef = useRef(onChange);
  scaleRef.current = scale;
  focusRef.current = { x: focusX, y: focusY };
  onChangeRef.current = onChange;

  const whole = frame && natural ? wholeImageScale(frame, natural) : sheetImageScaleMin;
  const canPan = scale > whole + scaleSlack;

  useEffect(() => {
    if (!frame || !natural) return;
    const fit = wholeImageScale(frame, natural);
    if (scale < fit - scaleSlack) {
      onChangeRef.current(sheetImageFocusCenter, sheetImageFocusCenter, fit);
    }
  }, [frame, natural, scale]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el || !url) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const frameSize = frameSizeRef.current;
      const naturalSize = naturalRef.current;
      const fit =
        frameSize && naturalSize ? wholeImageScale(frameSize, naturalSize) : sheetImageScaleMin;
      const notches = event.deltaY / sheetImageScaleWheelDivisor;
      const next = scaleRef.current * sheetImageScaleStep ** -notches;
      const limited = Math.min(sheetImageScaleMax, Math.max(fit, next));
      const focus = focusRef.current;
      if (limited <= fit + scaleSlack) {
        onChangeRef.current(sheetImageFocusCenter, sheetImageFocusCenter, fit);
        return;
      }
      onChangeRef.current(focus.x, focus.y, limited);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [url, frameRef, frameSizeRef, naturalRef]);

  function applyScale(next: number) {
    const limited = Math.min(sheetImageScaleMax, Math.max(whole, next));
    if (limited <= whole + scaleSlack) {
      onChange(sheetImageFocusCenter, sheetImageFocusCenter, whole);
      return;
    }
    onChange(focusX, focusY, limited);
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!url || !canPan) return;
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
    const frameSize = frameSizeRef.current;
    const naturalSize = naturalRef.current;
    if (!drag || !frameSize || !naturalSize) return;

    const box = sheetImageBox(frameSize, naturalSize, drag.originX, drag.originY, scaleRef.current);
    onChange(
      clampFocus(focusAfterDrag(drag.originX, e.clientX - drag.startX, frameSize.width, box.width)),
      clampFocus(focusAfterDrag(drag.originY, e.clientY - drag.startY, frameSize.height, box.height)),
      scaleRef.current,
    );
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  const shownScale = scale || sheetImageScaleDefault;

  return (
    <div className="image-focus-field">
      <span className="image-focus-label">Enquadramento no card</span>
      <div
        ref={frameRef}
        className={[
          'image-focus-preview',
          dragging ? 'is-dragging' : '',
          canPan ? 'can-pan' : '',
          !url ? 'is-empty' : '',
        ]
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
            src={resolveApiUrl(url)}
            alt=""
            draggable={false}
            className={natural && frame ? 'sheet-framed-image' : undefined}
            style={framedImageStyle(frame, natural, focusX, focusY, shownScale)}
            onLoad={(event) =>
              setNatural({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
          />
        ) : (
          <div className="image-focus-placeholder">A imagem aparece aqui</div>
        )}
        {url && <span className="image-focus-crosshair" aria-hidden />}
      </div>
      <div className="image-focus-zoom">
        <button
          type="button"
          disabled={!url || scale <= whole + scaleSlack}
          onClick={() => applyScale(shownScale / sheetImageScaleStep)}
        >
          Diminuir
        </button>
        <button
          type="button"
          disabled={!url || isWholeImage(shownScale, whole, focusX, focusY)}
          onClick={() => onChange(sheetImageFocusCenter, sheetImageFocusCenter, whole)}
        >
          Imagem inteira
        </button>
        <button
          type="button"
          disabled={!url || atSheetImageScaleMax(shownScale)}
          onClick={() => applyScale(shownScale * sheetImageScaleStep)}
        >
          Aumentar
        </button>
      </div>
      <p className="muted image-focus-hint">
        Arraste para enquadrar. Aumente para um detalhe ou reduza até ver a imagem inteira.
      </p>
    </div>
  );
}
