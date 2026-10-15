import { useEffect, useRef, useState } from 'react';
import {
  resolveApiUrl,
  sceneZoomMax,
  sceneZoomMin,
  sceneZoomStep,
  sceneZoomWheelDivisor,
} from '../config';
import type { CampaignScene } from '../types';

type Point = { x: number; y: number };
type Size = { w: number; h: number };

type Gesture =
  | { kind: 'drag'; x: number; y: number; ox: number; oy: number }
  | {
      kind: 'pinch';
      dist: number;
      scale: number;
      ox: number;
      oy: number;
      midX: number;
      midY: number;
    };

const zoomSlack = 0.001;

function clampZoom(value: number) {
  return Math.min(sceneZoomMax, Math.max(sceneZoomMin, value));
}

function atZoomMin(scale: number) {
  return scale <= sceneZoomMin + zoomSlack;
}

function atZoomMax(scale: number) {
  return scale >= sceneZoomMax - zoomSlack;
}

function fitContain(natW: number, natH: number, stageW: number, stageH: number): Size {
  if (natW <= 0 || natH <= 0 || stageW <= 0 || stageH <= 0) {
    return { w: 0, h: 0 };
  }

  const ratio = Math.min(stageW / natW, stageH / natH);
  return { w: natW * ratio, h: natH * ratio };
}

function clampOffset(offset: Point, scale: number, fitted: Size, stage: Size): Point {
  const maxX = Math.max(0, (fitted.w * scale - stage.w) / 2);
  const maxY = Math.max(0, (fitted.h * scale - stage.h) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

function zoomOffset(pointer: Point, offset: Point, scale: number, nextScale: number): Point {
  const ratio = scale === 0 ? 1 : nextScale / scale;
  return {
    x: pointer.x * (1 - ratio) + offset.x * ratio,
    y: pointer.y * (1 - ratio) + offset.y * ratio,
  };
}

export function SceneLightbox({
  scene,
  onClose,
}: {
  scene: CampaignScene;
  onClose: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const scaleRef = useRef(sceneZoomMin);
  const offsetRef = useRef<Point>({ x: 0, y: 0 });
  const fittedRef = useRef<Size>({ w: 0, h: 0 });
  const stageSizeRef = useRef<Size>({ w: 0, h: 0 });
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const [scale, setScale] = useState(sceneZoomMin);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [fitted, setFitted] = useState<Size>({ w: 0, h: 0 });
  const [panning, setPanning] = useState(false);
  const [seenId, setSeenId] = useState(scene.id);

  if (seenId !== scene.id) {
    setSeenId(scene.id);
    setScale(sceneZoomMin);
    setOffset({ x: 0, y: 0 });
    setFitted({ w: 0, h: 0 });
    setPanning(false);
    scaleRef.current = sceneZoomMin;
    offsetRef.current = { x: 0, y: 0 };
    fittedRef.current = { w: 0, h: 0 };
    pointers.current.clear();
    gesture.current = null;
  }

  function commit(nextScale: number, nextOffset: Point) {
    const clampedScale = clampZoom(nextScale);
    const clampedOffset = clampOffset(
      nextOffset,
      clampedScale,
      fittedRef.current,
      stageSizeRef.current,
    );
    scaleRef.current = clampedScale;
    offsetRef.current = clampedOffset;
    setScale(clampedScale);
    setOffset(clampedOffset);
  }

  function measure() {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img) return;

    const stageSize = { w: stage.clientWidth, h: stage.clientHeight };
    const nextFitted = fitContain(img.naturalWidth, img.naturalHeight, stageSize.w, stageSize.h);
    stageSizeRef.current = stageSize;
    fittedRef.current = nextFitted;
    setFitted(nextFitted);
    const nextOffset = clampOffset(offsetRef.current, scaleRef.current, nextFitted, stageSize);
    offsetRef.current = nextOffset;
    setOffset(nextOffset);
  }

  function stagePoint(clientX: number, clientY: number): Point {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: clientX - (rect.left + rect.width / 2),
      y: clientY - (rect.top + rect.height / 2),
    };
  }

  function zoomAt(clientX: number, clientY: number, nextScale: number) {
    const clamped = clampZoom(nextScale);
    commit(
      clamped,
      zoomOffset(stagePoint(clientX, clientY), offsetRef.current, scaleRef.current, clamped),
    );
  }

  function syncGesture() {
    const pts = [...pointers.current.values()];
    if (pts.length >= 2) {
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1;
      gesture.current = {
        kind: 'pinch',
        dist,
        scale: scaleRef.current,
        ox: offsetRef.current.x,
        oy: offsetRef.current.y,
        midX: (pts[0].x + pts[1].x) / 2,
        midY: (pts[0].y + pts[1].y) / 2,
      };
      setPanning(false);
      return;
    }

    if (pts.length === 1) {
      gesture.current = {
        kind: 'drag',
        x: pts[0].x,
        y: pts[0].y,
        ox: offsetRef.current.x,
        oy: offsetRef.current.y,
      };
      setPanning(!atZoomMin(scaleRef.current));
      return;
    }

    gesture.current = null;
    setPanning(false);
  }

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new ResizeObserver(() => measure());
    observer.observe(stage);
    measure();

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const notches = event.deltaY / sceneZoomWheelDivisor;
      zoomAt(event.clientX, event.clientY, scaleRef.current * Math.pow(sceneZoomStep, -notches));
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      observer.disconnect();
      stage.removeEventListener('wheel', onWheel);
    };
  }, [scene.id]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* captura só existe para um ponteiro real */
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    syncGesture();
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const current = gesture.current;
    if (!current) return;

    if (current.kind === 'pinch') {
      const pts = [...pointers.current.values()];
      if (pts.length < 2) return;
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1;
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      const nextScale = clampZoom(current.scale * (dist / current.dist));
      const zoomed = zoomOffset(
        stagePoint(current.midX, current.midY),
        { x: current.ox, y: current.oy },
        current.scale,
        nextScale,
      );
      commit(nextScale, {
        x: zoomed.x + (midX - current.midX),
        y: zoomed.y + (midY - current.midY),
      });
      return;
    }

    if (atZoomMin(scaleRef.current)) return;
    commit(scaleRef.current, {
      x: current.ox + (event.clientX - current.x),
      y: current.oy + (event.clientY - current.y),
    });
  }

  function onPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    syncGesture();
  }

  function zoomBy(direction: 1 | -1) {
    const next = clampZoom(
      scaleRef.current * (direction > 0 ? sceneZoomStep : 1 / sceneZoomStep),
    );
    commit(next, zoomOffset({ x: 0, y: 0 }, offsetRef.current, scaleRef.current, next));
  }

  const canPan = !atZoomMin(scale);
  const adjusted =
    atZoomMin(scale) && Math.abs(offset.x) < 0.5 && Math.abs(offset.y) < 0.5;

  return (
    <div className="scene-lightbox" role="dialog" aria-modal="true" aria-label={scene.title}>
      <button type="button" className="scene-lightbox-close" onClick={onClose}>
        Fechar imagem
      </button>
      <div
        ref={stageRef}
        className={`scene-lightbox-stage${canPan ? ' can-pan' : ''}${panning ? ' is-panning' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <img
          ref={imgRef}
          key={scene.id}
          src={resolveApiUrl(scene.imageUrl)}
          alt={scene.title}
          draggable={false}
          onLoad={measure}
          style={{
            width: fitted.w > 0 ? fitted.w : undefined,
            height: fitted.h > 0 ? fitted.h : undefined,
            visibility: fitted.w > 0 ? 'visible' : 'hidden',
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
          }}
        />
      </div>
      <div className="scene-lightbox-zoom">
        <button type="button" disabled={atZoomMin(scale)} onClick={() => zoomBy(-1)}>
          Diminuir
        </button>
        <button type="button" disabled={adjusted} onClick={() => commit(sceneZoomMin, { x: 0, y: 0 })}>
          Ajustar
        </button>
        <button type="button" disabled={atZoomMax(scale)} onClick={() => zoomBy(1)}>
          Aumentar
        </button>
      </div>
    </div>
  );
}
