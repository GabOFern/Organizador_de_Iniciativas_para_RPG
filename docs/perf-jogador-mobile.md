# Desempenho da visão do jogador (mobile)

## Problema

Jogadores abrem `/publico/:token` no celular (muitas vezes via Cloudflare). Hoje a página:

1. Faz **GET REST** do snapshot (`getPublicBattle`).
2. Abre um **SignalR** em `useBattleHub` → `JoinBattle` → recebe o **mesmo** snapshot.
3. O `ScenePanel` (somente leitura) abre **outro** SignalR → `JoinBattle` de novo → outro snapshot + lista de cenas.
4. O `ScenePanel` ainda faz **GET REST** das cenas (`listPublicScenes`).

No mobile isso multiplica WebSockets, CPU de parse JSON e rádio. Cada `JoinBattle` no servidor monta snapshot completo (`Include` Sheet + ActiveModifiers + query de SheetImages).

## O que resolve

- Menos conexões e menos payload no carregamento inicial.
- Mesma UX: fila ao vivo + imagens da sessão.
- Servidor faz menos `BuildSnapshotAsync` por jogador ao entrar.

## Como resolver (este corte)

### 1. Um hub por aba pública

Estender `useBattleHub` (reusar, não criar hub paralelo) para:

- Continuar escutando `BattleUpdated`.
- Aceitar callback opcional `onScenesUpdated` e escutar `ScenesUpdated` na **mesma** conexão.
- Assinatura sugerida: manter compatível com mestre (`accessToken` opcional).

`PublicBattlePage`:

- Usa o hub como fonte do snapshot e das cenas.
- **Não** chama `getPublicBattle` no mount se o hub estiver ativo; fallback REST só se a conexão falhar (ou após timeout sem snapshot — constante nomeada em `config.ts`, ex. `publicBattleHubFallbackMs = 4000`).
- Passa cenas ao `ScenePanel` por props controladas.

`ScenePanel` quando `canEdit === false` e recebe `scenes` + `onScenesChange` (ou `scenesControlled`):

- **Não** abre segundo SignalR.
- **Não** faz GET inicial de cenas (o hub / pai já fornece).
- Continua renderizando e marcando “visto” como hoje.

Quando `canEdit === true`, comportamento atual do painel pode permanecer (fora do foco, ou alinhar depois).

### 2. Snapshot público enxuto no banco (sem mudar contrato visual)

Em `BuildSnapshotAsync` com `forPublic: true`:

- Projetar só colunas de `Sheet` usadas no `CombatantDto` (Name, Image*, Type) — não materializar entidade Sheet completa se o EF permitir `Select`.
- Manter HP mascarado (`HideHpFromPublic`) como hoje.
- `lastTickEvents`: omitir no snapshot público (sempre `null`) — a UI pública não usa; só o mestre em `BattlePage`.

Não inventar DTO paralelo neste corte se o JSON já fica menor com projection + sem tick events; se for trivial, um record `PublicCombatantDto` é opcional — preferir KISS: mesmo `CombatantDto` / `BattleSnapshotDto`.

### 3. Imagens lazy no card somente leitura

Em `CombatantCard` com `readOnly`, `<img loading="lazy" decoding="async" />` para não baixar todos os retratos fora da viewport no carrossel/grade.

### Fora deste corte (próximos)

Confirmado pelas auditorias; não bloqueia o corte atual:

- Delta/patch SignalR (só mudanças).
- Endpoint de miniatura de retrato/cena (hoje até 4 MB por GET).
- No mobile (`max-width: 767px`): forçar 1 coluna na grade / carrossel padrão 1 item.
- `ResizeObserver` em `sheetImageFrame`: não `setFrame` se o tamanho não mudou; memoizar `CombatantCard`.
- CSS mobile: `background-attachment: scroll`; reduzir custo da aura/grão.
- Home `CampaignsHomePage`: pausar poll com `document.hidden`.
- Otimizar mestre (também tem hub duplo) reutilizando o mesmo hook.
- Trocar SQLite / CDN.

## Testes

### Unitários / contrato

- `useBattleHub` (teste com mock de connection se já houver harness; senão teste puro de módulo auxiliar):
  - Ou extrair `battleHubEvents = { battle: 'BattleUpdated', scenes: 'ScenesUpdated' }` e assertar nomes.
- `BuildSnapshot_ForPublic_OmitsLastTickEvents` — após build público, `LastTickEvents` é null.
- `BuildSnapshot_ForPublic_ProjectsSheetFields` — snapshot público inclui nome/imagem; teste de regressão HP oculto permanece.
- Função pura de política de fetch: `shouldUsePublicRestFallback({ hubConnected, receivedSnapshot, elapsedMs, fallbackMs })` em módulo pequeno (ex. `publicBattleLoad.ts`) + testes Vitest.

### Regressão

- Rodar Vitest: `CombatantListView`, `ScenePanel` / `sceneSeen`, `PublicLobbyPage`, `designTokens` se tocados.
- Rodar xUnit filtro `BattleService` / snapshot público / `HideHp`.
- Novo: `ScenePanel` com `canEdit={false}` e `scenes` controladas **não** chama `listPublicScenes` (mock api).
- Novo: `PublicBattlePage` ou harness — com hub mock que emite snapshot, não dispara REST (se testável sem jsdom SignalR real; senão testar `publicBattleLoad` + ScenePanel controlado).

### Revisão

Após implementar: um agente revisa front (hub único + ScenePanel) e outro revisa backend (projection + ticks) contra esta spec.
