import { useEffect, useRef, useState } from 'react';
import {
  sheetImageFocusCenter,
  sheetImageScaleDefault,
  sheetImageScaleMax,
  sheetImageScaleMin,
} from './config';

export type FrameSize = { width: number; height: number };

const axisSlack = 0.5;
const scaleSlack = 0.001;

export function clampSheetImageScale(value: number) {
  return Math.min(sheetImageScaleMax, Math.max(sheetImageScaleMin, value));
}

/** Escala em que a imagem inteira cabe no quadro, em relação ao preenchimento. */
export function wholeImageScale(frame: FrameSize, natural: FrameSize) {
  if (frame.width <= 0 || frame.height <= 0 || natural.width <= 0 || natural.height <= 0) {
    return sheetImageScaleMin;
  }

  const cover = Math.max(frame.width / natural.width, frame.height / natural.height);
  const contain = Math.min(frame.width / natural.width, frame.height / natural.height);
  if (cover <= 0) return sheetImageScaleMin;
  return clampSheetImageScale(contain / cover);
}

export function sheetImageBox(
  frame: FrameSize,
  natural: FrameSize,
  focusX: number,
  focusY: number,
  scale: number,
) {
  const cover = Math.max(frame.width / natural.width, frame.height / natural.height);
  const width = natural.width * cover * scale;
  const height = natural.height * cover * scale;
  return {
    width,
    height,
    left: ((frame.width - width) * focusX) / 100,
    top: ((frame.height - height) * focusY) / 100,
  };
}

export function focusAfterDrag(origin: number, pixelDelta: number, frame: number, display: number) {
  const slack = frame - display;
  if (Math.abs(slack) < axisSlack) return origin;
  return origin + (pixelDelta * 100) / slack;
}

export function clampFocus(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function isWholeImage(scale: number, whole: number, focusX: number, focusY: number) {
  return (
    Math.abs(scale - whole) <= scaleSlack
    && Math.abs(focusX - sheetImageFocusCenter) <= axisSlack
    && Math.abs(focusY - sheetImageFocusCenter) <= axisSlack
  );
}

export function atSheetImageScaleMax(scale: number) {
  return scale >= sheetImageScaleMax - scaleSlack;
}

export function useSheetImageFrame(src: string) {
  const frameRef = useRef<HTMLDivElement>(null);
  const naturalRef = useRef<FrameSize | null>(null);
  const frameSizeRef = useRef<FrameSize | null>(null);
  const [natural, setNaturalState] = useState<FrameSize | null>(null);
  const [frame, setFrame] = useState<FrameSize | null>(null);
  const [trackedSrc, setTrackedSrc] = useState(src);

  if (src !== trackedSrc) {
    setTrackedSrc(src);
    naturalRef.current = null;
    setNaturalState(null);
  }

  function setNatural(size: FrameSize | null) {
    naturalRef.current = size;
    setNaturalState(size);
  }

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const next = { width: rect.width, height: rect.height };
      frameSizeRef.current = next;
      setFrame(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  return { frameRef, natural, naturalRef, frame, frameSizeRef, setNatural };
}

export function framedImageStyle(
  frame: FrameSize | null,
  natural: FrameSize | null,
  focusX: number,
  focusY: number,
  scale: number,
) {
  if (!frame || !natural || frame.width <= 0 || frame.height <= 0) {
    return {
      objectPosition: `${focusX}% ${focusY}%`,
    };
  }

  const box = sheetImageBox(frame, natural, focusX, focusY, scale || sheetImageScaleDefault);
  return {
    left: box.left,
    top: box.top,
    width: box.width,
    height: box.height,
    objectFit: 'fill' as const,
  };
}
