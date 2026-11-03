export type PublicRestFallbackInput = {
  hubFailed: boolean;
  receivedSnapshot: boolean;
  elapsedMs: number;
  fallbackMs: number;
};

/** GET REST da página pública só se o hub falhou ou o timeout passou sem snapshot. */
export function shouldUsePublicRestFallback(input: PublicRestFallbackInput): boolean {
  if (input.receivedSnapshot) {
    return false;
  }

  if (input.hubFailed) {
    return true;
  }

  return input.elapsedMs >= input.fallbackMs;
}
