import { describe, expect, it } from 'vitest';
import { imageExceedsUploadLimit, sheetImageStoredMaxBytes, sheetImageUploadMaxBytes } from '../config';

describe('imageExceedsUploadLimit', () => {
  it('deixa passar arquivo acima de 4 MB e recusa acima de 20 MB', () => {
    expect(imageExceedsUploadLimit(sheetImageStoredMaxBytes + 1)).toBe(false);
    expect(imageExceedsUploadLimit(sheetImageUploadMaxBytes)).toBe(false);
    expect(imageExceedsUploadLimit(sheetImageUploadMaxBytes + 1)).toBe(true);
  });
});
