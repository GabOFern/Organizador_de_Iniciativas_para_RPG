# Quantidade na cena

Fichas como o sino entram mais de uma vez. No lugar da caixa de seleção, cada ficha da cena tem uma quantidade.

A linha fica assim, na mesma altura: miniatura, `Nome - Tipo`, e o controle `[ < número > ]`.

## Quantidade

O número começa em 0. Zero não entra na cena. Só fichas com quantidade maior que zero são gravadas, e a cena continua precisando de ao menos uma.

| Tipo | Máximo |
| --- | --- |
| Jogador | `LineupRules.MaxPlayerQuantity` (1) |
| Criatura e NPC | `LineupRules.MaxQuantity` (20) |

A mesma ficha continua uma vez só na cena; a quantidade diz quantas cópias. Acima do máximo, abaixo de 1 quando a ficha é enviada, ou jogador com mais de uma cópia: `LineupQuantityInvalid`.

O filtro só esconde a linha. A quantidade de uma ficha oculta permanece e entra na gravação.

Na lista de cenas, quantidade maior que 1 aparece como `Nome × quantidade`.

## Miniatura

A imagem da ficha aparece à esquerda, pequena. Sem imagem, fica um espaço vazio do mesmo tamanho, para as linhas continuarem alinhadas.

## Invocar

Cada cópia pede a própria iniciativa, ou **Rolar**. Três sinos abrem três linhas: `Sino 1`, `Sino 2`, `Sino 3`. Uma cópia só mantém o nome da ficha.

A lista enviada tem de ter exatamente essas cópias. Outra quantidade falha com `LineupMembersMismatch` e a fila não muda.

Jogador que já está na fila continua de fora. Criatura e NPC entram de novo, uma linha de combate por cópia.

## Fora deste corte

- Quantidade na invocação de uma ficha avulsa
- Nome diferente para cada cópia

## Testes

Unidade:

- `clampLineupQuantity_Jogador_ParaEmUm`
- `clampLineupQuantity_Criatura_RespeitaOMaximo`
- `expandLineupInvokeRows_Quantidade_AbreUmaLinhaPorCopia`
- `expandLineupInvokeRows_UmaCopia_MantemONome`

Regressão:

- `Create_Quantity_StoresCopies`
- `Create_PlayerQuantityAboveOne_ThrowsDomainException`
- `InvokeLineup_Quantity_AddsOneCombatantPerCopy`
- `cenas_Ficha_MiniaturaNomeEQuantidadeNaMesmaLinha`
- `cenas_Quantidade_GravaCopiasEMantemOculta`
