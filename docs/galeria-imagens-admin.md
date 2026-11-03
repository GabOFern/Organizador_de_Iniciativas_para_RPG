# Galeria de imagens (admin) e drawer só leitura

## Problema

1. O botão **Imagens** (aba lateral) mistura visualização dos jogadores com CRUD do mestre.
2. Retratos como Lysander acabam **duplicados**: uma vez na ficha (`SheetImage`) e outra como `CampaignScene` só para exibir fora de combate.
3. Falta uma tela de administração com filtros ricos (nome, categoria, **tags** N:N com regras And / Or / Not).

## O que resolve

- Drawer **Imagens** = só o que está **visível aos jogadores** agora (mestre e jogador veem a mesma lista de leitura).
- Nova rota do mestre **Imagens** = cadastro, tags, categoria, visibilidade, editar, excluir.
- Origem **ficha**: a cena aponta para um `SheetId` e reutiliza o binário/URL da ficha — sem segundo BLOB.

Não confundir com a nav **Cenas** (`/mestre/cenas` = lineups de invocação).

## Como resolver

### A — Drawer só leitura

`ScenePanel` (mestre e público):

- Lista **apenas** cenas com `IsVisibleToPlayers == true` (já é o caso no GET público; no mestre o drawer deixa de listar ocultas e deixa de ter Nova/Editar/Excluir/olho).
- Continua: abrir lightbox, contagem de novas, SignalR de lista pública.
- `canEdit` deixa de controlar CRUD no drawer (pode remover a prop ou ignorá-la). CRUD só na tela admin.

`MestreLayout` continua montando o drawer; deixa de passar fluxo de edição.

### B — Tela admin `/mestre/imagens`

Nova rota `routes.mestreImages` = `/mestre/imagens`, label nav `imagesNavLabel` = `Imagens` (ao lado de Fichas / Cenas).

Layout (lista):

```
| [Nome]                          |
| [Tags]              [Categoria] |   ← filtros
-----------------------------------
| [thumb] [Nome]                  |
| [Tags]          [Visualização]  |   ← toggle visível aos jogadores
| [Editar]        [Excluir]       |
| (+ Nova imagem)                 |
```

Criar/editar (modal ou formulário, reutilizar padrões de `ScenePanel` / `modal-imagem.md`):

- Título, categoria (`SceneKind` assignable: Item, Npc, Card, Map).
- Origem **uma** de: URL | arquivo | **ficha da campanha** (select).
- Tags: multi-select + criar tag nova (nome único por campanha, case-insensitive trim).

### C — Modelo e API

#### Tags

- `CampaignImageTag`: `Id`, `CampaignId`, `Name` (obrigatório, máx. `SceneRules.MaxTagNameLength` = 40).
- N:N `CampaignSceneTag` (`SceneId`, `TagId`).
- CRUD tags: listar / criar (idempotente por nome na campanha) / (opcional) excluir tag órfã depois.
- Cena carrega `Tags: { id, name }[]` nos DTOs de mestre.

#### Origem ficha

- `CampaignScene.SheetId` nullable FK → `Sheets`, `ON DELETE SET NULL` (ou Restrict — preferir SetNull se a ficha sumir e a cena ficar inválida até editar).
- Validação: exatamente uma origem entre URL, arquivo ou `SheetId` (não misturar).
- Se `SheetId` setado: lista/API devolvem `imageUrl` apontando para leitura da **ficha** (público: path de imagem pública da ficha; mestre: path master da ficha). Sem gravar `ImageContent` nessa linha.
- `GET .../scenes/{id}/image` (público e mestre): se a cena tem `SheetId`, proxy/stream da imagem da ficha; senão comportamento atual.

#### Filtro (puro, testável)

Módulo domínio/front compartilhado em conceito — implementar no front e espelhar regras no servidor se houver query string; neste corte o filtro da lista admin pode ser **só cliente** sobre a lista do GET, desde que a função pura exista:

```
filterGalleryItems(items, {
  nameQuery: string,
  category: 'all' | SceneKind,
  tagMode: 'and' | 'or',   // entre tags incluídas
  includeTagIds: string[],
  excludeTagIds: string[], // NOT: item não pode ter nenhuma destas
})
```

- Nome: contém (case-insensitive).
- Categoria: igualdade ou `all`.
- `tagMode and`: item deve ter **todas** `includeTagIds`.
- `tagMode or`: item deve ter **ao menos uma** de `includeTagIds`.
- `includeTagIds` vazio: não restringe por inclusão.
- `excludeTagIds`: item é excluído se tiver **qualquer** uma (NOT).

### D — Limites

Reusar `SceneRules.MaxScenesPerCampaign`. Novas constantes nomeadas para tags (`MaxTagNameLength`, `MaxTagsPerScene` = 20, `MaxTagsPerCampaign` = 100).

## Cortes de implementação

| Corte | Entrega |
| --- | --- |
| 1 | Drawer só leitura + rota/página admin com CRUD atual (Kind, visibility, URL/arquivo) sem tags/ficha |
| 2 | Tags N:N + UI filtros And/Or/Not + testes da função pura |
| 3 | `SheetId` origem + endpoints de imagem + UI select ficha |

Agentes: um por corte (backend/front separados quando paralelizar). Depois revisão por corte.

## Testes

### Corte 1

- `ScenePanel` mestre: não mostra botões Nova/Editar/Excluir; lista só visíveis (mock).
- Página admin: cria/edita/exclui/toggle visibilidade (RTL ou serviço).
- Regressão: jogador ainda vê só visíveis; hub `ScenesUpdated` público ok.

### Corte 2

- Unit: `filterGalleryItems_*` (and, or, not, nome, categoria, combinações).
- API: criar tag, atribuir à cena, listar cena com tags.
- RTL: filtro na admin page.

### Corte 3

- `Create_WithSheetId_NoBlob_UsesSheetImageUrl`
- `GetSceneImage_WithSheetId_ReturnsSheetBytes`
- `Create_SheetIdAndUrl_Throws`
- Regressão compressão/URL de cena sem ficha.

## Fora deste corte

- Renomear nav “Cenas” (lineups).
- Miniaturas server-side (perf).
- Tags no drawer do jogador (só admin filtra por tag; jogador vê a lista já visível).
