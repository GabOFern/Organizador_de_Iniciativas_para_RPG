# Remover login de usuário legado

O fluxo `/login` + `Users` + `Admin:*` deixa de existir. A única autenticação de mestre é a senha da campanha (`docs/auth-campanha-mestre.md`).

## Remover

- API: `AuthController`, `AuthService`, `AdminOptions`, entidade `User`, `AuthRules`, `LoginRequest`/`LoginResponse`, `IJwtTokenService.CreateToken(User)`, registro DI e seed de admin no `DbSeeder`
- Config: seção `Admin` em `appsettings.json` e `appsettings.Example.json`
- Web: `LoginPage.tsx`, rota/`routes.login`, CSS de `.login-*`
- Docs/README que citam admin legado ou `/login`
- Migration EF que **dropa** a tabela `Users` (histórico antigo permanece)

## Manter

- `CampaignService` create + master-login, JWT de campanha com `role=master`
- `IPasswordHasher<Campaign>`

## Testes

- `DbSeederTests` sem `AdminOptions` / `IPasswordHasher<User>`
- Build/testes existentes de `CampaignService` continuam verdes
- Opcional: assert de que não existe tipo/arquivo AuthController (não obrigatório se o build já falharia)
