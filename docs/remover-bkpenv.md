# Remover bkpenv.env

O arquivo `src/IniciativasRPG.Web/bkpenv.env` está versionado com URLs localhost (`VITE_API_BASE_URL`, `VITE_HUB_URL`). O Vite não o carrega. É lixo de backup e risco se alguém o copiar para `.env` num build.

## Mudanças

1. Apagar `src/IniciativasRPG.Web/bkpenv.env` do working tree e do índice git (`git rm` se tracked).
2. Atualizar `.gitignore` para cobrir backups de env, por exemplo:
   - `**/.env`
   - `**/*.env` (exceto permitir `.env.example` com negação `!**/.env.example` se necessário)
   - Garantir que `.env.example` continue versionável.
3. Nenhuma referência no código, `iniciar.bat` ou docs deve apontar para `bkpenv.env`. Se houver menção em README/docs, remover.

## Fora deste corte

- Mudar CORS, seeders, mensagens UI
- Alterar `.env.example` além do necessário para o gitignore

## Testes

- Teste que falha se `bkpenv.env` existir sob `src/IniciativasRPG.Web` (caminho relativo ao repo ou ao package Web). Nome sugerido: `BkpenvEnv_NaoDeveExistir` em suite Vitest existente (`iniciarBat.test.ts` ou `config.test.ts`) ou xUnit de smoke de repo.
- `git check-ignore` / assert de gitignore: arquivo fictício `bkpenv.env` ou `*.env` (exceto example) seria ignorado — opcional se o teste de ausência do arquivo já cobrir o aceite.
