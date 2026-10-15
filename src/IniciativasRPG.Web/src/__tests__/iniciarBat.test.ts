import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');
const batPath = path.join(repoRoot, 'iniciar.bat');

describe('iniciar.bat', () => {
  const bat = fs.readFileSync(batPath, 'utf8');

  it('define portas nomeadas da API e do Vite', () => {
    expect(bat).toMatch(/set "API_PORT=5111"/);
    expect(bat).toMatch(/set "WEB_PORT=5173"/);
  });

  it('encerra API e Vite antes de testes ou subida', () => {
    expect(bat).toContain('call :stop_dev_servers');
    expect(bat).toMatch(/call :stop_port %API_PORT%/);
    expect(bat).toMatch(/call :stop_port %WEB_PORT%/);

    const firstStop = bat.indexOf('call :stop_dev_servers');
    const startServices = bat.indexOf(':start_services');
    expect(firstStop).toBeGreaterThan(-1);
    expect(startServices).toBeGreaterThan(-1);
    expect(firstStop).toBeLessThan(startServices);
  });

  it('nao reaproveita processo antigo: sobe API e Web apos limpar', () => {
    expect(bat).not.toMatch(/A API ja esta/);
    expect(bat).not.toMatch(/O site ja esta/);
    expect(bat).toMatch(/Iniciando a API em http:\/\/localhost:%API_PORT%/);
    expect(bat).toMatch(/Iniciando o site em http:\/\/localhost:%WEB_PORT%/);
  });

  it('encerra janelas cmd do iniciador por titulo', () => {
    expect(bat).toContain('WINDOWTITLE eq IniciativasRPG API*');
    expect(bat).toContain('WINDOWTITLE eq IniciativasRPG Web*');
  });
});
