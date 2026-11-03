# Unificar mensagens de UI e limites nomeados

Dois eixos. Sem mudar comportamento visível além de centralizar literais.

## 1. Mensagens e marca no front

Em `src/IniciativasRPG.Web/src/config.ts` (ou módulo de mensagens importado por `config.ts`):

| Constante | Texto |
| --- | --- |
| `appBrandName` | `Iniciativas RPG` |
| `battleLoadFailedMessage` | `Falha ao carregar batalha.` |
| `invokeFailedMessage` | `Falha ao invocar.` |
| `scenesLoadFailedMessage` | `Falha ao carregar cenas.` |
| `noPublicBattleMessage` | `Não há combate em andamento.` |

Substituir literais iguais nas páginas/modais listados na auditoria (`BattlePage`, `SheetsPage`, `ScenesPage`, `ScenePanel`, `InvokeModal`, `InvokeSceneModal`, `ModifiersPage`, `LoginPage`, `PublicLobbyPage`, `PublicBattlePage`, `CampaignsHomePage`, `layout.tsx`) pelos exports. Manter `campaignsLoadFailedMessage` e `sheetDeleteFailedMessage` já existentes.

`characterClassLabels` e `uiThemeLabels` (classes 5e): uma única fonte de labels de classe; o outro importa ou reexporta (sem duas listas divergentes).

## 2. Limites no domínio + EF

Criar ou estender constantes em `*Rules` / tipos de domínio e usar no `AppDbContext` e nas validações:

| Constante sugerida | Valor atual | Uso |
| --- | --- | --- |
| `SheetRules.MaxNameLength` | 200 | `Sheets.Name`, e campanha se compartilhado ou `CampaignRules.MaxNameLength` = 200 |
| `SheetRules.MaxResistancesLength` | 4000 | `Sheets.Resistances` (+ Description de campanha se for o mesmo teto, senão constante própria) |
| `SheetRules.MaxEnumStringLength` | 20 | Type/Class/Kind enums como string |
| `SheetAttackRules` ou `SheetRules.MaxAttackDescriptionLength` | 500 | ataques/magias/armas Description; `LastActionMessage` |
| `SheetRules.MaxDiceExpressionLength` | 40 | DamageDice / HealDice |
| `SheetRules.MaxWeaponRangeLength` | 80 | Range |
| `ModifierRules.MaxNameLength` | 120 | ModifierTypes / instances Name |
| `ModifierRules.MaxIconKeyLength` | 40 | IconKey |
| `AuthRules.MaxUsernameLength` | 100 | Users.Username |
| `BattleRules.MaxPublicTokenLength` | 64 | PublicToken |
| `SheetRules.MaxSpellSlotLevel` | 9 | validação `SlotLevel` em `SheetService` |
| `SheetRules.MinSpellSlotLevel` | 0 | idem |
| `SheetRules.ImageFocusMin` / `ImageFocusMax` | 0 / 100 | clamp de foco no service; front `SheetsPage` / `sheetImageFrame` usa as mesmas ideias via `config` espelhando os números já usados |

`AbilityScores.Modifier` deve usar `DefaultScore` (10) na fórmula, não o literal `10`.

`DomainMessages` da batalha teste: montar a lista de nomes faltantes a partir de `DemoBattleRules.RequiredSheetNames` (sem repetir "Guarda Veterano, Goblin e Lobo" à mão).

Front: `SheetsPage` `min`/`max` de atributos e slot usam constantes de `config.ts` alinhadas a `AbilityScores` / slot (espelho numérico documentado no comentário, como já ocorre com lineup).

## Fora deste corte

- Centralizar todos os paths `/api/...` de `api.ts`
- `LineupInvokeMessage` → `DomainMessages` (opcional se couber sem estourar o PR; senão deixar)
- Logs de `SceneImageFetcher`
- CORS / seeders / bkpenv

## Testes

Backend:

- `SheetRules_MaxNameLength_MatchesExpected` (ou tabela de constantes) — valores 200, 4000, 9, 0, 100
- `AbilityScores_Modifier_UsesDefaultScore` — score 10 → 0; score 12 → 1
- Mensagem de demo battle: assert contém cada nome de `RequiredSheetNames`
- Se houver teste de validação de slot: nível 10 lança; nível 9 ok

Frontend:

- `config.test.ts`: exports das novas mensagens e `appBrandName` com os textos acima
- Regressão leve: `PublicBattlePage` / lobby se já tiverem teste de texto, atualizar para a constante
- `characterClassLabels` e tema: teste que as chaves de classe coincidem (um `expect` de igualdade de chaves ou referência)
