import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const cssPath = resolve(dirname(fileURLToPath(import.meta.url)), '../index.css');
const css = readFileSync(cssPath, 'utf8');

describe('design tokens', () => {
  it('declara --space-section, Cinzel e Crimson Pro', () => {
    expect(css).toContain('--space-section: 1.75rem');
    expect(css).toContain('--space-lg: 1.35rem');
    expect(css).toMatch(/--font-display:\s*'Cinzel'/);
    expect(css).toMatch(/--font-body:\s*'Crimson Pro'/);
  });

  it('separa toolbar da fila dos cards com --space-section', () => {
    expect(css).toMatch(/\.combatant-list-view\s*\{[^}]*gap:\s*var\(--space-section\)/);
    expect(css).toMatch(/\.combatant-view-toolbar\s*\{[^}]*gap:\s*var\(--space-xs\)/);
    expect(css).toMatch(/\.combatant-carousel\s*\{[^}]*column-gap:\s*var\(--space-sm\)/);
    expect(css).toMatch(/\n\.combatant-grid\s*\{[^}]*gap:\s*var\(--space-lg\)/);
  });
});
