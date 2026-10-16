import { describe, expect, it } from 'vitest';
import { lineupRowsReady } from '../lineupInvoke';

describe('lineupRowsReady', () => {
  it('lineupRowsReady_ExigeNumeroOuRolagem', () => {
    expect(lineupRowsReady([])).toBe(false);
    expect(lineupRowsReady([{ roll: false, initiative: '' }])).toBe(false);
    expect(lineupRowsReady([{ roll: false, initiative: '12' }])).toBe(true);
    expect(lineupRowsReady([{ roll: false, initiative: '-1' }])).toBe(true);
    expect(lineupRowsReady([{ roll: true, initiative: '' }])).toBe(true);
    expect(
      lineupRowsReady([
        { roll: true, initiative: '' },
        { roll: false, initiative: '4' },
      ]),
    ).toBe(true);
  });
});
