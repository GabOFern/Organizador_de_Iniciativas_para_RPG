# Autenticação do mestre da campanha

## Agora (este corte)

Qualquer pessoa cria uma campanha na home. Na criação informa uma **senha do mestre**. Essa senha:

1. É obrigatória (`CreateCampaignRequest.Password` / campo do formulário).
2. É gravada só como **hash** em `Campaigns.PasswordHash` — nunca texto puro, nunca devolvida nos DTOs de listagem/criação.
3. É exigida no botão **Mestre** (`POST /api/campaigns/{id}/master-login`). Senha correta → JWT de campanha; senha errada ou vazia → credenciais inválidas (mesma mensagem).

Algoritmo: `IPasswordHasher<Campaign>` do ASP.NET Identity (`PasswordHasher<T>`). É PBKDF2 com salt e iterações (HMAC-SHA512 na versão atual do Identity), **não** SHA-256/512 “cru” da senha. Hash puro sem salt é inadequado para senha; não trocar por SHA solto.

Quem conhece a senha entra como mestre daquela campanha. Não há dono/usuário cadastrado nesta etapa — a senha **é** a credencial da campanha.

Jogador continua pelo `PublicToken` (leitura), sem senha de mestre.

## Fluxo

```text
Criar campanha (nome + senha)
        │
        ▼
  PasswordHasher.HashPassword → Campaign.PasswordHash
        │
        ▼
  SampleNpcSheetSeeder (6 fichas de teste)
        │
Mestre clica "Mestre" + senha
        │
        ▼
  VerifyHashedPassword → JWT (claims de campanha + role master)
        │
        ▼
  Front guarda Bearer (sessionStorage) e chama APIs de mestre
```

## Claims do JWT de campanha (hoje)

| Claim | Significado |
| --- | --- |
| `sub` / `CampaignClaims.CampaignId` | Id da campanha |
| `CampaignClaims.CampaignName` | Nome |
| `CampaignClaims.Role` = `master` | Papel atual (gancho para o futuro) |

## Fora deste corte / futuro

Não implementar agora:

- Conta de usuário por pessoa (e-mail/login próprio)
- Tokens distintos mestre vs jogador autenticado
- Cookies HttpOnly, refresh token, cache de sessão
- Convites, vários mestres, troca de senha, reset

Quando vier:

- Tabela `Users` (ou identidades) ligada a campanhas por papel (`master` / `player`)
- JWT com `sub` = usuário e claim de campanha/papel; senha da campanha pode virar “código de ingresso” ou ser substituída por membership
- Cookies e refresh separados do Bearer em `sessionStorage`

O claim `Role=master` e o hash na campanha já deixam o modelo atual compatível com essa evolução sem reescrever o login do mestre.

## Testes

- `Create_ValidPassword_StoresHashNotPlaintext`
- `Create_EmptyPassword_Throws`
- `MasterLogin_CorrectPassword_ReturnsTokenWithMasterRole`
- `MasterLogin_WrongPassword_ThrowsUnauthorized`
- `List_DoesNotExposePasswordHash` (DTO / serialização — summary sem campo de senha)
