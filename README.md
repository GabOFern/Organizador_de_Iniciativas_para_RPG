# IniciativasRPG

Monorepo: ASP.NET Core API + SignalR + React (Vite) + SQLite.

## Pré-requisitos

- .NET 10 SDK
- Node.js 20+

## Configuração da API (segredos)

Não commit secrets. Use User Secrets:

```bash
cd src/IniciativasRPG.Api
dotnet user-secrets set "Jwt:Key" "SUA_CHAVE_COM_PELO_MENOS_32_CHARS"
dotnet user-secrets set "Admin:Username" "mestre"
dotnet user-secrets set "Admin:Password" "SuaSenhaSegura"
```

Veja também `appsettings.Example.json`.

## Rodar

```bash
# API (http://localhost:5111)
cd src/IniciativasRPG.Api
dotnet run --launch-profile http

# Web (http://localhost:5173)
cd src/IniciativasRPG.Web
cp .env.example .env   # Windows: copy .env.example .env
npm install
npm run dev
```

Login padrão (após configurar User Secrets): usuário/senha definidos em `Admin:*`.

Backlog: [docs/BACKLOG.md](docs/BACKLOG.md).
