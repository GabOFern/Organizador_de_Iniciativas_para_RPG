# IniciativasRPG.Web

Frontend React + TypeScript + Vite do monorepo **IniciativasRPG**.

## Documentação

- Setup e uso: [README na raiz do repositório](../../README.md)
- URLs, CORS, Cloudflare (`iniciar.bat /publico`), ngrok e domínio: [docs/CONFIGURACAO-E-DEPLOY.md](../../docs/CONFIGURACAO-E-DEPLOY.md)

## Dev local

```bash
copy .env.example .env
npm install
npm run dev
```

Com `VITE_API_BASE_URL` vazio, o Vite faz proxy de `/api` e `/hubs` para a API em `http://localhost:5111` (veja `vite.config.ts`).
