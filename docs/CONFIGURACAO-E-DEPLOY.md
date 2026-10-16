# Configuração de URLs e deploy

Como apontar o **frontend** e a **API** para localhost, ngrok, Cloudflare Tunnel ou um domínio próprio — com base no código atual do repositório.

## Visão geral

```text
Browser ──► Frontend (Vite / estático)
               │
               ├─ REST:  VITE_API_BASE_URL + /api/...
               └─ Hub:   VITE_HUB_URL  (SignalR /hubs/battle)
                        │
                        ▼
                   API ASP.NET (:5111 em local)
```

- Front lê `VITE_API_BASE_URL` e `VITE_HUB_URL` em [`src/IniciativasRPG.Web/src/config.ts`](../src/IniciativasRPG.Web/src/config.ts).
- Em desenvolvimento, o Vite pode **proxyar** `/api` e `/hubs` para a API ([`vite.config.ts`](../src/IniciativasRPG.Web/vite.config.ts)), permitindo `VITE_API_BASE_URL` vazio (mesma origem).
- A API só aceita origens listadas em `Cors:AllowedOrigins` ([`Program.cs`](../src/IniciativasRPG.Api/Program.cs) + [`appsettings.json`](../src/IniciativasRPG.Api/appsettings.json)).

## Variáveis

### Frontend (`.env` / build)

| Variável | Exemplo | Significado |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | *(vazio)* ou `https://api.seudominio.com` | Prefixo das chamadas HTTP. Vazio = mesma origem (proxy ou reverse proxy). |
| `VITE_HUB_URL` | `/hubs/battle` ou `https://api.seudominio.com/hubs/battle` | URL do SignalR. |

Copie de [`.env.example`](../src/IniciativasRPG.Web/.env.example). Variáveis `VITE_*` são embutidas no **build**; mudar URL em produção exige novo `npm run build` (ou injeção no build).

### Backend (User Secrets / env / appsettings)

| Chave | Exemplo | Significado |
|-------|---------|-------------|
| `Jwt:Key` | string ≥ 32 chars | Assinatura do JWT (obrigatório). |
| `Jwt:Issuer` / `Jwt:Audience` | `IniciativasRPG` / `IniciativasRPG.Web` | Validação do token. |
| `Cors:AllowedOrigins` | `https://app.seudominio.com` | Origins do browser que podem chamar a API (com credentials). |
| `CampaignSeed:Password` | senha | Senha da campanha seed (dev). |
| `ConnectionStrings:Default` | `Data Source=iniciativasrpg.db` | SQLite. |
| `Admin:Username` / `Admin:Password` | opcional | Seed de usuário admin legado. |

No ASP.NET Core, env vars usam `__` no lugar de `:`:

```bash
# Linux / Cloudflare / Docker-style
export Jwt__Key="sua-chave-longa-aleatoria-min-32"
export Cors__AllowedOrigins__0="https://app.seudominio.com"
export Cors__AllowedOrigins__1="https://outro-front.example"
export CampaignSeed__Password="..."
```

PowerShell (sessão atual):

```powershell
$env:Jwt__Key = "sua-chave-longa-aleatoria-min-32"
$env:Cors__AllowedOrigins__0 = "https://abc123.ngrok-free.app"
```

## Cenários

### 1. Local (recomendado) — proxy Vite

**Front** (`.env`):

```env
VITE_API_BASE_URL=
VITE_HUB_URL=/hubs/battle
```

**API** (`Cors:AllowedOrigins`):

```json
"AllowedOrigins": [ "http://localhost:5173" ]
```

O browser fala só com `:5173`; o Vite encaminha `/api` e `/hubs` (WebSocket incluso) para `http://localhost:5111`.

### 2. Cloudflare Quick Tunnel — recomendado para sessão de jogo (`iniciar.bat /publico`)

**Preferir ao ngrok free:** não há tela “Visit Site” / interstitial; o link abre direto. Não exige conta Cloudflare.

Pré-requisito: [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) no PATH:

```bat
winget install -e --id Cloudflare.cloudflared
```

#### Via iniciador (Windows)

```bat
iniciar.bat /publico
iniciar.bat /skiptests /publico
```

O script sobe API + Vite, inicia `cloudflared tunnel --url http://localhost:5173`, captura a URL `https://….trycloudflare.com`, grava em `public/share-origin.txt`, copia para o clipboard e abre o **mestre em localhost**.

- **Mestre:** `http://localhost:5173` (sessão própria no `sessionStorage` local).
- **Jogadores:** URL `trycloudflare.com` (ou o “Link público” na batalha, montado a partir de `share-origin.txt`).
- Assim mestre e jogador **não compartilham** a mesma sessão do browser (problema típico de abrir o túnel nos dois papéis).
- A URL do Quick Tunnel **muda a cada execução**. Log: `logs/cloudflared.log` / `logs/public-url.txt`.
- Vite já libera o host em [`vite.config.ts`](../src/IniciativasRPG.Web/vite.config.ts) (`allowedHosts: ['.trycloudflare.com']`).
- Com `VITE_API_BASE_URL` vazio, as chamadas são same-origin pelo proxy — **não é necessário** alterar CORS para o Quick Tunnel.
- Rotas `/publico/...` nunca enviam JWT, mesmo se houver token de mestre no storage.

#### Manual (qualquer SO)

1. API e `npm run dev` como no cenário 1.
2. `cloudflared tunnel --url http://localhost:5173`
3. Abrir a URL impressa e compartilhar com os jogadores.

Para hostname **fixo**, use a seção 4 (túnel nomeado + domínio).

### 2b. ngrok — um túnel só no Vite (alternativa)

O plano free do ngrok costuma mostrar uma página “Visit Site” antes do app — evite se os jogadores forem abrir o link no celular.

1. API e `npm run dev` rodando localmente (como no cenário 1).
2. Túnel na porta do front:

```bash
ngrok http 5173
```

3. Abra a URL `https://….ngrok-free.app` gerada pelo ngrok.

Como o tráfego passa pelo proxy do Vite, **não é obrigatório** mudar `VITE_*`.  
Se o browser bloquear por CORS (origem virou a URL do ngrok), acrescente essa origin na API:

```json
"Cors:AllowedOrigins": [
  "http://localhost:5173",
  "https://SEU_SUBDOMINIO.ngrok-free.app"
]
```

Ou via env: `Cors__AllowedOrigins__0=https://SEU_SUBDOMINIO.ngrok-free.app`.

Reinicie a API após alterar CORS.

### 3. ngrok / URLs públicas separadas (front e API)

Quando o front **não** usa o proxy (build estático ou dois túneis):

**Front** `.env` (ou env de build):

```env
VITE_API_BASE_URL=https://API_PUBLICA.ngrok-free.app
VITE_HUB_URL=https://API_PUBLICA.ngrok-free.app/hubs/battle
```

**API CORS** — origin do **front**:

```json
"AllowedOrigins": [ "https://FRONT_PUBLICO.ngrok-free.app" ]
```

Checklist:

- HTTPS no front + HTTPS na API (evitar Mixed Content).
- Hub com WebSockets habilitados no túnel/proxy.
- Path do hub: `/hubs/battle`.

### 4. Cloudflare Tunnel — link fixo com o app no seu PC (recomendado)

A intenção aqui **não** é migrar para a nuvem: API e front continuam no seu computador. O Cloudflare Tunnel só publica um **HTTPS estável** na internet (melhor que ngrok para uso pessoal: grátis, sem rate limit agressivo).

Portas deste projeto:

| Serviço | Porta local |
|---------|-------------|
| Front (Vite `npm run dev`) | `5173` |
| API (`dotnet run --launch-profile http`) | `5111` |

#### Opção A — um hostname só no Vite (mais simples, igual ao ngrok)

O browser acessa só o front; o Vite faz proxy de `/api` e `/hubs` para a API. **Não precisa** mudar `VITE_*`.

1. Baixe o [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
2. Conta Cloudflare (grátis) e login:

```bash
cloudflared tunnel login
```

3. Crie um túnel nomeado (URL fixa exige túnel nomeado + hostname; ver DNS abaixo):

```bash
cloudflared tunnel create iniciativasrpg
```

4. Arquivo de config (Windows: `%USERPROFILE%\.cloudflared\config.yml` · Linux/macOS: `~/.cloudflared/config.yml`):

```yaml
tunnel: iniciativasrpg
credentials-file: C:\Users\SEU_USUARIO\.cloudflared\<TUNNEL_ID>.json
# Linux/macOS: credentials-file: /home/SEU_USUARIO/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Um único host → Vite (proxy cuida da API e do SignalR)
  - hostname: rpg.seudominio.com
    service: http://localhost:5173
  - service: http_status:404
```

Substitua `<TUNNEL_ID>` pelo ID gerado em `tunnel create` (também aparece na pasta `.cloudflared`).

5. DNS (domínio na sua conta Cloudflare — o plano free basta):

```bash
cloudflared tunnel route dns iniciativasrpg rpg.seudominio.com
```

6. Com a API e o `npm run dev` rodando:

```bash
cloudflared tunnel run iniciativasrpg
```

7. **CORS** — a origin do browser passa a ser a URL pública. Em User Secrets / env / `appsettings`:

```json
"Cors": {
  "AllowedOrigins": [
    "http://localhost:5173",
    "https://rpg.seudominio.com"
  ]
}
```

```powershell
$env:Cors__AllowedOrigins__0 = "https://rpg.seudominio.com"
```

**Front `.env`** (igual ao local com proxy):

```env
VITE_API_BASE_URL=
VITE_HUB_URL=/hubs/battle
```

Resultado: jogadores abrem `https://rpg.seudominio.com` — link fixo enquanto o túnel e o PC estiverem ligados.

Para subir o túnel com o Windows:

```bash
cloudflared service install
```

#### Opção B — dois hostnames (front e API separados)

Use se quiser expor a API em subdomínio próprio (sem depender do proxy do Vite), por exemplo após `npm run build` + servidor estático, ou dois serviços distintos.

```yaml
tunnel: iniciativasrpg
credentials-file: C:\Users\SEU_USUARIO\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: rpg.seudominio.com
    service: http://localhost:5173
  - hostname: api.rpg.seudominio.com
    service: http://localhost:5111
  - service: http_status:404
```

```bash
cloudflared tunnel route dns iniciativasrpg rpg.seudominio.com
cloudflared tunnel route dns iniciativasrpg api.rpg.seudominio.com
```

**Front** `.env` (ou `.env.production` no build):

```env
VITE_API_BASE_URL=https://api.rpg.seudominio.com
VITE_HUB_URL=https://api.rpg.seudominio.com/hubs/battle
```

Reinicie o Vite (ou rode `npm run build` de novo) — `VITE_*` são lidas na subida/build.

**API CORS:**

```json
"AllowedOrigins": [ "https://rpg.seudominio.com" ]
```

#### Túnel rápido sem domínio (`*.trycloudflare.com`)

Sem domínio próprio — o caminho mais simples é `iniciar.bat /publico` (seção 2). Manualmente:

```bash
cloudflared tunnel --url http://localhost:5173
```

Gera uma URL `https://….trycloudflare.com`. É prático para a mesa, mas a URL **muda a cada execução**. Para hostname estável, use a **Opção A/B com domínio** na Cloudflare (gratuito).

#### Checklist Cloudflare + este projeto

- API em `:5111` e front em `:5173` ligados **antes** de `tunnel run`.
- Opção A: CORS com `https://seu-hostname`; `VITE_API_BASE_URL` vazio.
- Opção B: `VITE_*` apontando para o hostname da API; CORS com o hostname do front.
- SignalR / WebSockets: o túnel Cloudflare encaminha WS; na Opção A o proxy Vite já tem `ws: true`.
- Não commitar o JSON de credentials do túnel.

### 5. Hospedar o front na nuvem (opcional)

Só se um dia servir o `dist` (Cloudflare Pages, etc.) em vez do Vite no PC:

```bash
cd src/IniciativasRPG.Web
# VITE_API_BASE_URL=https://api.rpg.seudominio.com
# VITE_HUB_URL=https://api.rpg.seudominio.com/hubs/battle
npm run build
```

`VITE_*` entram no bundle no **build**. A API pode continuar no PC atrás do Tunnel (Opção B) ou em outro host.
## SignalR

- Endpoint: `MapHub<BattleHub>("/hubs/battle")`.
- Auth do hub (mestre): token JWT pode ir em `?access_token=` na conexão (já tratado em `Program.cs`).
- Proxy Vite: `ws: true` em `/hubs`.
- Visão pública entra no hub com o token público da campanha/batalha conforme a API.

## Checklist de problemas comuns

| Sintoma | Causa provável | O que fazer |
|---------|----------------|-------------|
| API sobe e cai: “Configure Jwt:Key” | Chave ausente ou &lt; 32 chars | User Secrets / `Jwt__Key` |
| Login ou fetch falha no browser (CORS) | Origin do front não está em `AllowedOrigins` | Incluir a URL **exata** (scheme + host, sem path) |
| `VITE_API_BASE_URL não configurada` | Sem `.env` | Copiar `.env.example` → `.env` |
| 404 em `/api/...` com proxy | API não está na 5111 | Conferir `dotnet run --launch-profile http` e `vite.config.ts` |
| Hub não conecta | WS bloqueado / URL do hub errada | `VITE_HUB_URL`, proxy `ws`, firewall/túnel |
| Página HTTPS chamando API HTTP | Mixed Content | Ambos HTTPS ou proxy same-origin |
| Login 500 via proxy | API offline | Subir a API; o proxy do Vite devolve 500 se o target cair |

## Referência rápida de arquivos

| Arquivo | Papel |
|---------|--------|
| `src/IniciativasRPG.Web/.env.example` | Modelo das `VITE_*` |
| `src/IniciativasRPG.Web/vite.config.ts` | Proxy `/api` e `/hubs` → `:5111` |
| `src/IniciativasRPG.Web/src/config.ts` | Leitura das env no runtime do front |
| `src/IniciativasRPG.Api/appsettings.json` | CORS default local |
| `src/IniciativasRPG.Api/appsettings.Example.json` | Exemplo sem secrets reais |
| `src/IniciativasRPG.Api/Program.cs` | CORS, JWT, hub |

Voltar ao [README](../README.md).
