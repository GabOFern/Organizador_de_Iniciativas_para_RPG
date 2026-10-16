# IniciativasRPG

Rastreador de iniciativas para D&D: ASP.NET Core API + SignalR, React (Vite) e SQLite.

O mestre gerencia campanhas, fichas e combate; jogadores acompanham a batalha em tempo real pela visão pública (somente leitura).

## Pré-requisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)

## Configuração inicial (API)

**Não commite senhas, JWT nem `.env`.** Valores sensíveis vão em User Secrets (dev) ou variáveis de ambiente (produção).

```bash
cd src/IniciativasRPG.Api
dotnet user-secrets set "Jwt:Key" "SUA_CHAVE_ALEATORIA_COM_PELO_MENOS_32_CHARS"
dotnet user-secrets set "CampaignSeed:Password" "SuaSenhaDaCampanhaInicial"
```

Opcional (seed de usuário admin legado, se ainda usado):

```bash
dotnet user-secrets set "Admin:Username" "mestre"
dotnet user-secrets set "Admin:Password" "SuaSenhaSegura"
```

Estrutura de exemplo: [`src/IniciativasRPG.Api/appsettings.Example.json`](src/IniciativasRPG.Api/appsettings.Example.json).

## Rodar localmente

### 1. API — `http://localhost:5111`

```bash
cd src/IniciativasRPG.Api
dotnet run --launch-profile http
```

### 2. Web — `http://localhost:5173`

```bash
cd src/IniciativasRPG.Web
copy .env.example .env
# Linux/macOS: cp .env.example .env
npm install
npm run dev
```

O `.env.example` deixa `VITE_API_BASE_URL` vazio e usa o **proxy do Vite** (`/api` e `/hubs` → API na porta 5111). Isso é o modo recomendado em desenvolvimento e com **um único túnel** na porta 5173.

### Atalho Windows — `iniciar.bat`

```bat
iniciar.bat                 rem testes + sobe API e site
iniciar.bat /skiptests      rem sobe sem rodar testes
iniciar.bat /publico        rem sobe + Cloudflare Quick Tunnel (link público sem tela Visit)
iniciar.bat /skiptests /publico
```

Com `/publico` é preciso ter o [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) no PATH (`winget install -e --id Cloudflare.cloudflared`). O iniciador abre o **mestre em localhost** e copia a URL `https://….trycloudflare.com` para os **jogadores**. O “Link público” na batalha também usa essa origem (arquivo `share-origin.txt`).

Detalhes (túnel nomeado, CORS, ngrok): [docs/CONFIGURACAO-E-DEPLOY.md](docs/CONFIGURACAO-E-DEPLOY.md).

## Uso rápido

1. Abra `http://localhost:5173` — grade de **campanhas**.
2. **Nova campanha** — nome, senha do mestre (e opcionalmente foto/descrição).
3. **Mestre** — informe a senha da campanha → área autenticada (batalha, fichas, modificadores).
4. **Jogador** — abre a visão pública da campanha (token) → acompanha o combate ao vivo, sem editar.
5. No mestre: cadastre **fichas** (atributos, ataques, magias, armas, enquadramento da imagem), **tipos de modificador**, monte a **batalha**, avance turnos.
6. **Tema** (seletor na UI) — personalização visual só na sessão do navegador.

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [docs/CONFIGURACAO-E-DEPLOY.md](docs/CONFIGURACAO-E-DEPLOY.md) | URLs, CORS, Cloudflare Tunnel (`iniciar.bat /publico` e link fixo), ngrok |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Stories e fases do produto |

## Segurança

- Não versionar `.env`, `appsettings.Development.json` com segredos reais, nem databases com dados sensíveis.
- JWT e senhas de campanha: só User Secrets / env / secret store.
- Token do mestre: header `Authorization: Bearer`. A visão pública usa o token da campanha como identificador de leitura, não como credencial de edição.
