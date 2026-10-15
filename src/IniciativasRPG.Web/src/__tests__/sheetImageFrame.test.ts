import { describe, it, expect } from 'vitest';
import {
  clampSheetImageScale,
  wholeImageScale,
  sheetImageBox,
  focusAfterDrag,
  clampFocus,
  isWholeImage,
  atSheetImageScaleMax,
  framedImageStyle,
} from '../sheetImageFrame';
import {
  sheetImageScaleMin,
  sheetImageScaleMax,
  sheetImageScaleDefault,
  sheetImageFocusCenter,
} from '../config';

describe('clampSheetImageScale', () => {
  it('retorna min se valor é menor que min', () => {
    expect(clampSheetImageScale(-1)).toBe(sheetImageScaleMin);
  });

  it('retorna max se valor é maior que max', () => {
    expect(clampSheetImageScale(100)).toBe(sheetImageScaleMax);
  });

  it('retorna o próprio valor se está no intervalo', () => {
    expect(clampSheetImageScale(1)).toBe(1);
  });
});

describe('wholeImageScale', () => {
  it('retorna min para frame vazio', () => {
    expect(wholeImageScale({ width: 0, height: 0 }, { width: 100, height: 100 }))
      .toBe(sheetImageScaleMin);
  });

  it('retorna min para imagem natural vazia', () => {
    expect(wholeImageScale({ width: 200, height: 200 }, { width: 0, height: 0 }))
      .toBe(sheetImageScaleMin);
  });

  it('retorna 1 quando aspecto é idêntico', () => {
    // frame 200x200, natural 200x200 → cover=1, contain=1 → contain/cover=1
    expect(wholeImageScale({ width: 200, height: 200 }, { width: 200, height: 200 })).toBe(1);
  });

  it('retorna <1 quando imagem é mais larga que o frame', () => {
    // frame 100x100, natural 200x100
    // cover = max(100/200, 100/100) = 1
    // contain = min(100/200, 100/100) = 0.5
    const result = wholeImageScale({ width: 100, height: 100 }, { width: 200, height: 100 });
    expect(result).toBe(0.5);
  });
});

describe('sheetImageBox', () => {
  const frame = { width: 100, height: 100 };
  const natural = { width: 200, height: 100 };

  it('com scale=1 aplica cover', () => {
    const box = sheetImageBox(frame, natural, 50, 50, 1);
    // cover = max(100/200, 100/100) = 1, width = 200*1*1=200, height=100*1*1=100
    expect(box.width).toBe(200);
    expect(box.height).toBe(100);
  });

  it('focus 50% centraliza', () => {
    const box = sheetImageBox(frame, natural, 50, 50, 1);
    expect(box.left).toBe((100 - 200) * 50 / 100); // -50
    expect(box.top).toBe(0);
  });

  it('focus 0% alinha ao início', () => {
    const box = sheetImageBox(frame, natural, 0, 0, 1);
    expect(box.left).toBeCloseTo(0);
  });
});

describe('focusAfterDrag', () => {
  it('não altera foco quando frame=display (sem slack)', () => {
    expect(focusAfterDrag(50, 100, 200, 200)).toBe(50);
  });

  it('move foco proporcionalmente ao arrasto', () => {
    // frame=100, display=200, slack=-100, delta=50 → 50 + (50*100/-100)= 50 - 50 = 0
    expect(focusAfterDrag(50, 50, 100, 200)).toBe(0);
  });
});

describe('clampFocus', () => {
  it('limita a 0 quando negativo', () => {
    expect(clampFocus(-10)).toBe(0);
  });

  it('limita a 100 quando acima de 100', () => {
    expect(clampFocus(150)).toBe(100);
  });

  it('mantém valor no intervalo', () => {
    expect(clampFocus(42)).toBe(42);
  });
});

describe('isWholeImage', () => {
  it('true quando scale igual ao whole e foco centralizado', () => {
    expect(isWholeImage(0.5, 0.5, sheetImageFocusCenter, sheetImageFocusCenter)).toBe(true);
  });

  it('false quando scale difere do whole', () => {
    expect(isWholeImage(1, 0.5, sheetImageFocusCenter, sheetImageFocusCenter)).toBe(false);
  });

  it('false quando foco não está centralizado', () => {
    expect(isWholeImage(0.5, 0.5, 10, 50)).toBe(false);
  });
});

describe('atSheetImageScaleMax', () => {
  it('true quando no max', () => {
    expect(atSheetImageScaleMax(sheetImageScaleMax)).toBe(true);
  });

  it('false quando abaixo do max', () => {
    expect(atSheetImageScaleMax(1)).toBe(false);
  });
});

describe('framedImageStyle', () => {
  it('sem frame/natural retorna objectPosition fallback', () => {
    const style = framedImageStyle(null, null, 30, 70, 1);
    expect(style).toEqual({ objectPosition: '30% 70%' });
  });

  it('com frame e natural retorna left/top/width/height', () => {
    const frame = { width: 100, height: 100 };
    const natural = { width: 100, height: 100 };
    const style = framedImageStyle(frame, natural, 50, 50, sheetImageScaleDefault);
    expect(style).toHaveProperty('width');
    expect(style).toHaveProperty('height');
    expect(style).toHaveProperty('left');
    expect(style).toHaveProperty('top');
    expect(style.objectFit).toBe('fill');
  });
});
