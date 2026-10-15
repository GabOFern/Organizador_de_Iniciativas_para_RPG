import { describe, it, expect } from 'vitest';
import { resolveCampaignsLoadView } from '../campaignsLoadUi';
import {
  campaignsLoadingMessage,
  campaignsLoadMaxConsecutiveFailures,
  requestFailedMessage,
} from '../config';

describe('resolveCampaignsLoadView', () => {
  it('H1: falha transitória antes do primeiro sucesso mostra loading', () => {
    const view = resolveCampaignsLoadView({
      hasLoadedOnce: false,
      consecutiveFailures: 1,
      lastError: requestFailedMessage,
      maxConsecutiveFailures: campaignsLoadMaxConsecutiveFailures,
      loadingMessage: campaignsLoadingMessage,
    });

    expect(view.kind).toBe('loading');
    if (view.kind === 'loading') {
      expect(view.message).toBe(campaignsLoadingMessage);
    }
  });

  it('H2: ao atingir o limiar sem sucesso mostra error', () => {
    const view = resolveCampaignsLoadView({
      hasLoadedOnce: false,
      consecutiveFailures: campaignsLoadMaxConsecutiveFailures,
      lastError: requestFailedMessage,
      maxConsecutiveFailures: campaignsLoadMaxConsecutiveFailures,
      loadingMessage: campaignsLoadingMessage,
    });

    expect(view).toEqual({ kind: 'error', message: requestFailedMessage });
  });

  it('H3: após sucesso sem erro mostra ready', () => {
    const view = resolveCampaignsLoadView({
      hasLoadedOnce: true,
      consecutiveFailures: 0,
      lastError: null,
      maxConsecutiveFailures: campaignsLoadMaxConsecutiveFailures,
      loadingMessage: campaignsLoadingMessage,
    });

    expect(view).toEqual({ kind: 'ready' });
  });

  it('H4: após sucesso com erro de reload mostra error', () => {
    const view = resolveCampaignsLoadView({
      hasLoadedOnce: true,
      consecutiveFailures: 1,
      lastError: requestFailedMessage,
      maxConsecutiveFailures: campaignsLoadMaxConsecutiveFailures,
      loadingMessage: campaignsLoadingMessage,
    });

    expect(view).toEqual({ kind: 'error', message: requestFailedMessage });
  });
});
