import { describe, it, expect, vi, afterEach } from 'vitest';
import { api } from '../api';
import { sheetDeleteConfirmMessage } from '../config';
import { confirmSheetDeletePrompt, shouldProceedSheetDelete } from '../sheetDelete';

describe('sheetDelete', () => {
  it('confirmSheetDeletePrompt_RetornaMensagemPadrao', () => {
    expect(confirmSheetDeletePrompt()).toBe(sheetDeleteConfirmMessage);
  });

  it('shouldProceedSheetDelete_false_NaoProssegue', () => {
    expect(shouldProceedSheetDelete(false)).toBe(false);
  });

  it('shouldProceedSheetDelete_true_Prossegue', () => {
    expect(shouldProceedSheetDelete(true)).toBe(true);
  });
});

describe('api.deleteSheet', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('DeleteSheet_ChamaDELETE_NoEndpointCorreto', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });
    vi.stubGlobal('fetch', fetchMock);

    await api.deleteSheet('11111111-1111-1111-1111-111111111111');

    expect(fetchMock).toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/sheets/11111111-1111-1111-1111-111111111111');
    expect(init.method).toBe('DELETE');
  });
});
