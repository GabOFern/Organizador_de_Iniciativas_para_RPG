import { describe, expect, it } from 'vitest';
import {
  sceneEditDialogLabel,
  sceneEditorHeading,
  sceneEditorSubmitLabel,
  sceneIncludeLabel,
  sceneNewLabel,
  sceneSaveLabel,
} from '../config';

describe('sceneEditor', () => {
  it('sceneEditorHeading_Criar_UsaNovaImagem', () => {
    expect(sceneEditorHeading(false)).toBe(sceneNewLabel);
  });

  it('sceneEditorHeading_Editar_UsaEditarImagem', () => {
    expect(sceneEditorHeading(true)).toBe(sceneEditDialogLabel);
  });

  it('sceneEditorSubmitLabel_Criar_Incluir_Editar_Salvar', () => {
    expect(sceneEditorSubmitLabel(false)).toBe(sceneIncludeLabel);
    expect(sceneEditorSubmitLabel(true)).toBe(sceneSaveLabel);
  });
});
