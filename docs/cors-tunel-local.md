# CORS e AllowedHosts no fluxo local + túnel

O app roda no PC do mestre. Jogadores entram por Cloudflare Quick Tunnel ou ngrok no **Vite (:5173)**. A API (:5111) fica atrás do proxy do Vite. Neste fluxo o browser fala só com a origem do túnel/front; `/api` e `/hubs` são same-origin via proxy.

## Decisão

Não restringir `AllowedHosts` nem exigir lista dinâmica de `trycloudflare.com` / ngrok no CORS para o fluxo padrão (`iniciar.bat /publico`).

| Chave | Valor versionado | Motivo |
| --- | --- | --- |
| `Cors:AllowedOrigins` | `http://localhost:5173` em `appsettings.json` | Mestre no localhost; proxy Vite. |
| `AllowedHosts` | `*` | Host do túnel muda a cada Quick Tunnel; filtrar hosts quebraria o fluxo sem ganho neste modelo. |

Quando o front **não** usa proxy (dois túneis / build estático apontando `VITE_API_BASE_URL` para a API pública), aí sim a origin do front entra em `Cors:AllowedOrigins` via env — já documentado em `CONFIGURACAO-E-DEPLOY.md`.

## Mudanças desta spec

1. Em `docs/CONFIGURACAO-E-DEPLOY.md`, seção curta **"CORS neste projeto"** no início da parte de CORS/túnel:
   - Com `/publico` (túnel só no Vite + `VITE_*` vazio): **não alterar** CORS nem AllowedHosts.
   - `AllowedHosts: *` é intencional enquanto a API só escuta localmente e o túnel aponta ao front.
   - Só acrescentar origins quando o browser chamar a API em **outra origem** (cenário 2b/3 do doc).
2. Garantir que `appsettings.json` continue com `localhost:5173` e `AllowedHosts: *` (sem mover CORS “só Development” de um jeito que o boot de produção local sem Development quebre o mestre).
3. Se `CorsOptions` / `Program.cs` tiverem comentário útil apontando para este doc, pode acrescentar uma linha; sem mudar a policy.

## Fora deste corte

- Remover `bkpenv.env`
- Refatorar `iniciar.bat`
- Whitelist automática de subdomínios Cloudflare

## Testes

- Teste de documentação ou de configuração tipada: se existir teste de `CorsOptions` / bind, assertar que o default versionado inclui `http://localhost:5173`.
- Se não houver harness fácil: um teste unitário mínimo que lê o JSON de `appsettings.json` do projeto Api (caminho relativo ao assembly de teste ou content root conhecido) e verifica `Cors:AllowedOrigins` contém `http://localhost:5173` e `AllowedHosts` é `*`.
- Não quebrar testes existentes de boot.
