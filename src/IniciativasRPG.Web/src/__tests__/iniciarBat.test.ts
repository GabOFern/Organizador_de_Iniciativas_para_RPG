import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');
const batPath = path.join(repoRoot, 'iniciar.bat');

describe('iniciar.bat', () => {
  const batRaw = fs.readFileSync(batPath);
  const bat = batRaw.toString('utf8');

  it('usa CRLF para o cmd.exe achar rotulos goto', () => {
    // LF-only quebra labels no cmd ("nao pode localizar o rotulo")
    expect(batRaw.includes(Buffer.from('\r\n'))).toBe(true);
    const withoutCrlf = Buffer.from(bat.replace(/\r\n/g, '\n'));
    expect(withoutCrlf.includes(Buffer.from('\n'))).toBe(true);
    // nenhum LF solto (todos devem fazer parte de CRLF)
    const text = batRaw.toString('binary');
    expect(text.replace(/\r\n/g, '').includes('\n')).toBe(false);
  });

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
    expect(bat).toContain('WINDOWTITLE eq IniciativasRPG Tunnel*');
  });

  it('aceita flag /publico e combina com outras flags via parse_args', () => {
    expect(bat).toContain(':parse_args');
    expect(bat).toMatch(/if \/I "%~1"=="\/publico" set "PUBLICO=1"/);
    expect(bat).toMatch(/if \/I "%~1"=="\/skiptests" set "SKIP_TESTS=1"/);
    expect(bat).toMatch(/if \/I "%~1"=="\/force" set "FORCE_START=1"/);
  });

  it('salva ROOT antes do shift para nao corromper caminhos', () => {
    const rootIdx = bat.indexOf('set "ROOT=%~dp0"');
    const parseIdx = bat.indexOf(':parse_args');
    expect(rootIdx).toBeGreaterThan(-1);
    expect(parseIdx).toBeGreaterThan(rootIdx);
    expect(bat).toContain('if "%ROOT:~-1%"=="\\" set "ROOT=%ROOT:~0,-1%"');
    expect(bat).toContain('%ROOT%\\src\\IniciativasRPG.Api');
    expect(bat).toContain('cd /d "%ROOT%\\src\\IniciativasRPG.Api"');
  });

  it('protege ProgramFiles x86 em variavel PF86 para nao quebrar o cmd', () => {
    expect(bat).toMatch(/set "PF86=%ProgramFiles\(x86\)%"/);
    expect(bat).toContain('%PF86%\\cloudflared');
    // PATH nao deve interpolar (x86) direto (quebra blocos/if do cmd)
    expect(bat).not.toMatch(/set "PATH=.*%ProgramFiles\(x86\)%/);
  });

  it('sobe API e Web via cd na pasta alvo sem start /D', () => {
    expect(bat).toContain('cd /d "%ROOT%\\src\\IniciativasRPG.Api"');
    expect(bat).toContain('cd /d "%ROOT%\\src\\IniciativasRPG.Web"');
    expect(bat).not.toMatch(/start "IniciativasRPG API" \/D/);
    expect(bat).not.toMatch(/start "IniciativasRPG Web" \/D/);
  });

  it('com /publico exige cloudflared e sobe Quick Tunnel na porta do Vite', () => {
    expect(bat).toContain('where cloudflared');
    expect(bat).toContain('CLOUDFLARED_EXE');
    expect(bat).toContain('winget install -e --id Cloudflare.cloudflared');
    expect(bat).toContain('IniciativasRPG Tunnel');
    expect(bat).toMatch(/cloudflared tunnel --url http:\/\/localhost:%WEB_PORT% --output json/);
    expect(bat).toContain('trycloudflare.com');
    expect(bat).toContain('wait-cloudflare-url.ps1');
    expect(bat).toContain('logs\\public-url.txt');
  });

  it('com /publico abre localhost para o mestre e grava share-origin para jogadores', () => {
    expect(bat).toMatch(/^:start_tunnel$/m);
    const label = bat.search(/^:start_tunnel$/m);
    expect(label).toBeGreaterThan(-1);
    const tunnelSection = bat.slice(label);
    expect(tunnelSection).toContain('share-origin.txt');
    expect(tunnelSection).toContain('abrir-web.bat');
    expect(tunnelSection).toContain('LINK DOS JOGADORES:');
    expect(tunnelSection).toContain('npm run dev');
    expect(tunnelSection).toMatch(/start "IniciativasRPG Web" cmd \/k "%ROOT%\\logs\\abrir-web.bat"/);
    expect(tunnelSection).toMatch(/start "" "http:\/\/localhost:%WEB_PORT%"/);
    expect(tunnelSection).not.toMatch(/start "" "%PUBLIC_URL%"/);
    expect(tunnelSection).toContain('Mestre:');
    expect(tunnelSection).toContain('Jogadores');
  });
});

