# IniciativasRPG

Organizador de iniciativas para D&D: API ASP.NET Core + SignalR, front React (Vite) e SQLite.

O mestre cria a campanha com uma senha (hash no banco), gerencia fichas, cenas, modificadores e o combate. Os jogadores acompanham a batalha em tempo real pela visão pública (somente leitura), inclusive pelo celular via túnel.

Na primeira subida o banco **não** traz campanha pronta: você cria a mesa na UI. Cada campanha nova recebe só as **6 fichas da batalha simulada** (Guarda, Goblin, Lobo, etc.); o restante do conteúdo é seu.

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Configuração inicial (API)](#configuração-inicial-api)
- [Rodar localmente](#rodar-localmente)
  - [API](#1-api--httplocalhost5111)
  - [Web](#2-web--httplocalhost5173)
  - [Atalho Windows — iniciar.bat](#atalho-windows--iniciarbat)
- [Uso rápido](#uso-rápido)
- [O que o produto faz](#o-que-o-produto-faz)
- [Documentação](#documentação)
- [Segurança](#segurança)

## Pré-requisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)

## Configuração inicial (API)

**Não commite senhas, JWT nem `.env`.** Valores sensíveis vão em User Secrets (dev) ou variáveis de ambiente (produção).

```bash
cd src/IniciativasRPG.Api
dotnet user-secrets set "Jwt:Key" "SUA_CHAVE_ALEATORIA_COM_PELO_MENOS_32_CHARS"
```

A senha do **mestre da campanha** não vem de User Secrets: é definida na criação da campanha na UI e guardada com `PasswordHasher` (PBKDF2 + salt), nunca em texto puro. Não há login global de usuário.

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

O `.env.example` deixa `VITE_API_BASE_URL` vazio e usa o **proxy do Vite** (`/api` e `/hubs` → API na porta 5111). Modo recomendado em desenvolvimento e com **um único túnel** na porta 5173.

### Atalho Windows — `iniciar.bat`

```bat
iniciar.bat                 rem testes + sobe API e site
iniciar.bat /skiptests      rem sobe sem rodar testes
iniciar.bat /publico        rem sobe + Cloudflare Quick Tunnel (link público sem tela Visit)
iniciar.bat /skiptests /publico
iniciar.bat /h              rem ajuda das flags
```

Com `/publico` é preciso ter o [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) no PATH (`winget install -e --id Cloudflare.cloudflared`). O iniciador abre o **mestre em localhost** e copia a URL `https://….trycloudflare.com` para os **jogadores**. O “Link público” na batalha também usa essa origem (`share-origin.txt`).

No fluxo `/publico` (túnel só no Vite) **não é necessário** mudar CORS nem `AllowedHosts`. Detalhes: [docs/CONFIGURACAO-E-DEPLOY.md](docs/CONFIGURACAO-E-DEPLOY.md).

## Uso rápido

1. Abra `http://localhost:5173` — lista de **campanhas** (pode estar vazia na primeira vez).
2. **Nova campanha** — nome, **senha do mestre** (obrigatória) e opcionalmente foto/descrição. A campanha já nasce com as 6 fichas de exemplo da batalha teste.
3. **Mestre** — informe a senha da campanha → JWT com papel `master` → batalha, fichas, cenas, modificadores.
4. **Jogador** — visão pública pelo token da campanha → combate ao vivo, sem editar.
5. No mestre: fichas (atributos, ataques, magias, armas, imagem), **cenas de invocação**, fila em **grade/carrossel** (com foco Turno/Livre), tipos de modificador, avanço de turnos.
6. **Tema** — personalização visual só na sessão do navegador.

## O que o produto faz

| Área | Comportamento |
|------|----------------|
| Campanhas | Criação livre; senha do mestre hasheada; login do mestre por senha; jogador por link/token público |
| Boot | Sem campanha seed; só as 6 fichas de batalha simulada por campanha |
| Combate | Iniciativa, turnos, SignalR, batalha teste automática |
| Fichas / cenas | Repositório com filtro, invocação em lote, imagens comprimidas |
| Sessão pública | Cloudflare Quick Tunnel via `iniciar.bat /publico` |

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [docs/CONFIGURACAO-E-DEPLOY.md](docs/CONFIGURACAO-E-DEPLOY.md) | URLs, CORS, Cloudflare Tunnel, ngrok |
| [docs/auth-campanha-mestre.md](docs/auth-campanha-mestre.md) | Senha do mestre, hash, JWT e gancho para auth futura |
| [docs/remover-login-legado.md](docs/remover-login-legado.md) | Remoção do `/login` e da tabela Users |
| [docs/design-system.md](docs/design-system.md) | Cores, fontes, espaçamento, cards e fila |
| [docs/perf-jogador-mobile.md](docs/perf-jogador-mobile.md) | Menos hub/REST na visão pública do jogador |
| [docs/galeria-imagens-admin.md](docs/galeria-imagens-admin.md) | Drawer só leitura + admin de imagens/tags/ficha |
| [docs/fichas-campanha-editaveis.md](docs/fichas-campanha-editaveis.md) | Boot vazio e fichas só da batalha simulada |
| [docs/visualizacao-fila-iniciativa.md](docs/visualizacao-fila-iniciativa.md) | Grade e carrossel na fila |
| [docs/foco-carrossel-fila.md](docs/foco-carrossel-fila.md) | Foco Turno / Livre no carrossel |
| [docs/cenas-de-invocacao.md](docs/cenas-de-invocacao.md) | Cenas para invocar conjuntos de fichas |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Stories e fases do produto |

Specs de qualidade pontuais (CORS, mensagens, etc.) também ficam em [`docs/`](docs/).

## Segurança

- Não versionar `.env`, `appsettings.Development.json` com segredos reais, nem databases com dados sensíveis.
- JWT: User Secrets / env (`Jwt:Key` ≥ 32 caracteres).
- Senha da campanha: só hash no SQLite; nunca no DTO de listagem; verificação no login do mestre.
- Token do mestre: header `Authorization: Bearer`. A visão pública usa o token da campanha como identificador de leitura, não como credencial de edição.
