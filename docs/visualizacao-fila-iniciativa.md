# Visualização da fila de iniciativa

No celular, abaixo de 640px, `.combatant-grid` vira uma coluna. Os cartões altos empilham e a fila vira uma rolagem longa. Mestre e jogador escolhem quantas fichas aparecem por vez.

A escolha vale nas duas telas: `BattlePage` e `PublicBattlePage`. O cartão continua `CombatantCard`. No público ele segue somente leitura. No mestre, dano, cura e o restante dos controles do cartão continuam.

## Modos

Um modo por vez. O padrão é `grid`.

| Modo | O que mostra |
| --- | --- |
| `grid` | As fichas da fila, em N colunas |
| `carousel` | N fichas por página, com **Página anterior**, **Próxima página** e o indicador `Pg i/total` (`combatantViewPageLabel`) |

## Quantidade

`itemsPerView` vai de `combatantViewMinItems` (1) a `combatantViewMaxItems` (6). O padrão é `combatantViewDefaultItems` (2).

Na grade, N é o número de colunas. No carrossel, N é quantas fichas entram em cada página.

`clampItemsPerView` corta o valor: não finito volta a 2; o restante perde a parte decimal (`Math.trunc`) e fica entre 1 e 6.

## Grade

A lista usa `grid-template-columns: repeat(N, minmax(0, 1fr))`, na classe `.combatant-grid--cols-N`.

N colunas permanecem no celular. A regra de 640px que força `1fr` não cobre essa classe.

A grade desenha a fila inteira. Não fatia por página.

## Carrossel

A página é 1-based. `pageSlice` devolve `slice((page - 1) * N, page * N)`, com N já clampado.

`pageCount` é `max(1, ceil(count / N))`. Fila vazia conta como 1 página, sem ficha.

`clampPage` traz a página para o intervalo `1..pageCount`. Página não finita volta a 1. Se a fila encolher, ou se N aumentar, a página atual desce até a última que ainda existe.

**Página anterior** fica desabilitado na página 1. **Próxima página** fica desabilitado na última. A página não salta para o outro extremo.

As setas têm alvo de pelo menos `--touch-min`.

Arrastar na horizontal no trilho do carrossel troca de página quando o deslocamento passa de `combatantViewSwipeThresholdPx` (48). Para a esquerda, próxima; para a direita, anterior. Abaixo do limiar, a página fica. Na ponta desabilitada, o arrasto nessa direção não muda a página. O gesto fica no trilho; não usa o lightbox das cenas.

## Controles

Três botões no mesmo grupo, nas duas telas:

| Botão | Rótulo | Efeito |
| --- | --- | --- |
| Grade | `combatantViewGridLabel` | Modo `grid` |
| Carrossel | `combatantViewCarouselLabel` | Modo `carousel`, aberto na página 1 |
| Quantidade | `combatantViewQuantityLabel` | Abre o stepper |

O stepper é o mesmo desenho curto da quantidade na cena: diminuir, número, aumentar. O número é `itemsPerView`, entre 1 e 6. Cada mudança grava a preferência e, no carrossel, reclampa a página.

## Preferência

Uma preferência por aparelho, em `localStorage`, chave `combatantViewPrefsStorageKey` (`iniciativasrpg.combatantViewPrefs`).

O valor é JSON `{ mode, itemsPerView }`.

Sem chave, JSON inválido ou valor que não é objeto: `grid` e 2. Modo diferente de `grid` ou `carousel` volta a `grid`; a quantidade desse objeto ainda passa por `clampItemsPerView`. Quantidade ausente ou que não é número volta a 2.

`saveCombatantViewPrefs` grava o modo válido e a quantidade já clampada. Trocar modo ou quantidade nas duas telas usa a mesma chave.

## Funções puras

Em `combatantView.ts`: `clampItemsPerView`, `pageCount`, `pageSlice`, `clampPage`.

Em `combatantViewPrefs.ts`: `loadCombatantViewPrefs`, `saveCombatantViewPrefs`. Limites, rótulos e a chave ficam em `config.ts`.

## Fora deste corte

- Backend, API e snapshot
- A faixa **Agora** e a lista compacta de `docs/tela-do-jogador-mobile.md`
- Redesenhar o cartão
- Sincronizar a preferência entre aparelhos

## Testes

Unidade de `combatantView`:

- `clampItemsPerView_ForaDoIntervalo_FicaEntreUmESeis`
- `clampItemsPerView_NaoFinito_VoltaAoPadrao`
- `pageCount_OitoComTres_DaTres`
- `pageCount_ListaVazia_RetornaUm`
- `pageSlice_Pagina_CortaOIntervalo`
- `clampPage_FilaEncolhe_NaoPassaDoTotal`

Unidade de `combatantViewPrefs` (Storage falso):

- `loadCombatantViewPrefs_Vazio_RetornaGradeEDois`
- `saveAndLoad_RoundTrip`
- `loadCombatantViewPrefs_JsonInvalido_RetornaPadrao`

Regressão da lista (`CombatantListView.test.tsx`):

- `lista_GradeN3_TresColunasEOitoItens`
- `lista_CarrosselN3ComOito_PaginaUmMostraTres`
- `lista_Carrossel_Avancar_IndicadorDoisDeTres`
- `lista_FilaEncolhe_ClampDaPaginaSemCrash`

Regressão da barra (`CombatantViewToolbar.test.tsx`):

- `toolbar_TrocarModo_PersisteNoStorage`
- `toolbar_Quantidade_AlteraItemsPerView`
