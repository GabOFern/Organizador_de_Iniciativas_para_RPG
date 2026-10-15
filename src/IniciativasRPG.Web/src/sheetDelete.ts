import { sheetDeleteConfirmMessage } from './config';

/** Texto de confirmação da exclusão — isolado para regressão de UI/API. */
export function confirmSheetDeletePrompt(): string {
  return sheetDeleteConfirmMessage;
}

export function shouldProceedSheetDelete(confirmed: boolean): boolean {
  return confirmed;
}
