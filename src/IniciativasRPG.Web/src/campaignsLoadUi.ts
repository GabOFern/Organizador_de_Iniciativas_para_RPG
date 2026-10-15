export type CampaignsLoadState = {
  hasLoadedOnce: boolean;
  consecutiveFailures: number;
  lastError: string | null;
  maxConsecutiveFailures: number;
  loadingMessage: string;
};

export type CampaignsLoadView =
  | { kind: 'loading'; message: string }
  | { kind: 'ready' }
  | { kind: 'error'; message: string };

export function resolveCampaignsLoadView(state: CampaignsLoadState): CampaignsLoadView {
  if (!state.hasLoadedOnce) {
    if (
      state.consecutiveFailures >= state.maxConsecutiveFailures &&
      state.lastError
    ) {
      return { kind: 'error', message: state.lastError };
    }

    return { kind: 'loading', message: state.loadingMessage };
  }

  if (state.lastError) {
    return { kind: 'error', message: state.lastError };
  }

  return { kind: 'ready' };
}
