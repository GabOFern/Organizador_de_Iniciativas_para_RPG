# Foco do carrossel da fila

No carrossel a pessoa troca de página à mão. O turno muda pelo snapshot e a ficha de quem age pode ficar fora da página. O **Foco** decide se a página acompanha o turno ou se a navegação continua livre.

A escolha vale nas duas telas: `BattlePage` e `PublicBattlePage`. O botão só existe com `mode === 'carousel'`. Na grade ele não é desenhado. O cartão não muda.

## Modos de foco

Um foco por vez. O padrão é `free` (`combatantViewDefaultFocusMode`).

| `focusMode` | Rótulo | O que faz |
| --- | --- | --- |
| `turn` | `combatantViewFocusTurnLabel` (`Foco - Turno`) | A página mostra o combatente do turno. Setas e swipe ficam desligados. |
| `free` | `combatantViewFocusFreeLabel` (`Foco - Livre`) | Navegação manual, como hoje: **Página anterior**, **Próxima página** e o arrasto no trilho. |

O botão é um toggle no mesmo grupo da barra. Um clique troca `turn` e `free`. O texto visível é o estado atual. `aria-pressed` fica verdadeiro em `turn`. O nome acessível é `combatantViewFocusToggleAriaLabel`. A classe `primary` marca `turn`; `free` fica `ghost`.

Ao passar para `turn`, a página salta na hora para a página do turno. Ao voltar para `free`, a página fica onde está e as setas e o swipe voltam a valer.

`free` no carrossel aberto a partir da grade continua na página 1. `turn` já gravado, ao entrar no carrossel, abre na página do turno.

## Página do turno

`findCurrentTurnIndex` devolve o primeiro índice (0-based) com `isCurrentTurn && !isDead`. Se não houver nenhum, devolve `-1`. Combatente morto com `isCurrentTurn` não conta. Dois vivos no turno: vale o primeiro da lista.

Com índice `-1`, a página não muda. Não há salto forçado.

`pageForCombatantIndex(index, itemsPerView)` usa N já passado por `clampItemsPerView` e devolve `floor(index / N) + 1`. A lista aplica `clampPage` em seguida, no intervalo `1..pageCount`.

O indicador `Pg i/total` (`combatantViewPageLabel`) continua visível nos dois focos.

## Turno no snapshot

A lista recebe os `combatants` do snapshot (SignalR nas duas telas). Com `turn` ativo, cada atualização da fila, do turno ou de N recalcula a página e permanece nela.

Sem vivo no turno, essa atualização não mexe na página.

Em `turn`, **Página anterior** e **Próxima página** ficam `disabled` em qualquer página. `goTo` não corre. O arrasto no trilho não troca de página, mesmo acima de `combatantViewSwipeThresholdPx`. Não há navegação livre temporária: o próximo snapshot não precisa “puxar de volta”.

## Preferência

A mesma chave de aparelho, `combatantViewPrefsStorageKey` (`iniciativasrpg.combatantViewPrefs`).

O JSON passa a ser `{ mode, itemsPerView, focusMode }`. `focusMode` é `'turn'` ou `'free'`.

Sem a chave, JSON inválido ou valor que não é objeto: o padrão inteiro, com `free`. Objeto antigo sem `focusMode`, ou com valor diferente de `turn` e `free`: `mode` e `itemsPerView` seguem as regras já existentes; `focusMode` volta a `free`.

`saveCombatantViewPrefs` grava o modo de foco já validado, junto com o modo de vista e a quantidade clampada. Trocar o foco nas duas telas usa a mesma chave. O valor permanece na grade; o botão só volta a aparecer no carrossel.

## Funções puras

Em `combatantView.ts`: `findCurrentTurnIndex`, `pageForCombatantIndex`. O tipo é `CombatantFocusMode` (`'turn' | 'free'`).

Em `combatantViewPrefs.ts`: `loadCombatantViewPrefs` e `saveCombatantViewPrefs` leem e gravam `focusMode`. Rótulos, o nome acessível e `combatantViewDefaultFocusMode` ficam em `config.ts`.

## Fora deste corte

- Foco na grade
- Backend, API e formato do snapshot
- Sincronizar a preferência entre aparelhos

## Testes

Unidade de `combatantView`:

- `findCurrentTurnIndex_TurnoVivo_RetornaIndice`
- `findCurrentTurnIndex_DoisVivos_PrimeiroIndice`
- `findCurrentTurnIndex_SoTurnoMorto_RetornaMenosUm`
- `findCurrentTurnIndex_NenhumTurno_RetornaMenosUm`
- `pageForCombatantIndex_IndiceZero_PaginaUm`
- `pageForCombatantIndex_TerceiroComDois_PaginaDois`
- `pageForCombatantIndex_ItemsPerViewInvalido_UsaClamp`

Unidade de `combatantViewPrefs` (Storage falso):

- `loadCombatantViewPrefs_SemFocusMode_VoltaLivre`
- `loadCombatantViewPrefs_FocusInvalido_VoltaLivre`
- `saveAndLoad_FocusTurn_RoundTrip`

Regressão da lista (`CombatantListView.test.tsx`):

- `lista_Foco_SoNoCarrossel`
- `lista_AtivarFocoTurno_SaltaParaPaginaDoTurno`
- `lista_EntrarNoCarrosselComFocoTurno_AbreNaPaginaDoTurno`
- `lista_FocoTurno_SnapshotNovoTurno_AcompanhaPagina`
- `lista_FocoTurno_SemTurnoVivo_NaoMudaPagina`
- `lista_FocoTurno_SetasESwipeDesabilitados`
- `lista_FocoLivre_SetasESwipeFuncionam`
- `lista_FocoTurno_MudarQuantidade_RecalculaPagina`

Regressão da barra (`CombatantViewToolbar.test.tsx`):

- `toolbar_Foco_AlternaEPersiste`
