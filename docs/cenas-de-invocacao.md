# Cenas de invocação

Uma cena de invocação é um conjunto nomeado de fichas da campanha. O mestre monta a cena uma vez (os jogadores, o cemitério) e, na batalha, informa a iniciativa de cada ficha e confirma. Todas entram juntas.

Isso não é a aba **Imagens**. Imagem da sessão continua em `CampaignScene`. A cena deste corte é o tipo `Lineup`.

Invocar uma cena **soma** combatentes à batalha aberta. Não remove quem já está na fila e não finaliza o combate.

## Tela Cenas

No menu do mestre, ao lado de Fichas, entra **Cenas** (`lineupsNavLabel`), rota `/mestre/cenas`.

A tela lista as cenas da campanha: nome e as fichas, na ordem em que foram escolhidas. Dá para criar, abrir, alterar e excluir.

| Ação | Campos | Resultado |
| --- | --- | --- |
| Criar | nome e ao menos uma ficha | a cena aparece na lista |
| Alterar | nome e fichas, já preenchidos | a lista reflete a troca |
| Excluir | confirmação | some a cena; as fichas continuam na campanha |
| Ler | a lista | só cenas desta campanha |

Regras de gravação:

- O nome é obrigatório, sem espaços nas pontas, no máximo `LineupRules.MaxNameLength` (80).
- É preciso ao menos uma ficha (`LineupRules.MinMembers`).
- A mesma ficha não entra duas vezes na mesma cena.
- Toda ficha tem de ser desta campanha.
- Excluir uma ficha tira só o vínculo. A cena permanece.

Mensagens: `LineupNameRequired`, `LineupNameTooLong`, `LineupNeedsMembers`, `LineupDuplicateSheet`, `LineupSheetNotInCampaign`, `LineupNotFound`.

## Invocar

Na fila de iniciativa, o botão **Invocar** continua abrindo o modal de uma ficha. Ao lado, uma seta (`invokeOptionsLabel`) abre duas opções:

- **Invocar ficha** (`invokeSheetLabel`): o mesmo modal de hoje.
- **Invocar cena** (`invokeLineupLabel`): escolhe uma cena e abre as fichas dela.

Na cena, cada ficha tem um número de iniciativa e a opção **Rolar**. Rolar usa `1d20` mais o bônus de iniciativa da ficha, como na invocação de criatura. Sem rolar, o número digitado vale, inclusive negativo. Confirmar só segue quando toda ficha tem número ou está marcada para rolar.

Confirmar grava todos de uma vez. Jogador entra com a vida visível. Criatura e NPC entram com a vida oculta para o jogador, como na invocação avulsa.

Se um jogador dessa cena já está na fila, ele não entra de novo e os outros entram. Criatura e NPC entram mesmo que a mesma ficha já esteja na batalha. A resposta traz a mensagem `Cena {nome}: {Nome} {iniciativa}, ... .` e, se alguém ficou de fora, ` Já na fila: {nomes}.` Se ninguém novo entrou: `Cena {nome}: ninguém entrou. Já na fila: {nomes}.`

Se a cena não tem mais fichas, a invocação falha com `LineupEmpty` e a fila não muda. Se a lista enviada não é exatamente a da cena, falha com `LineupMembersMismatch` e a fila não muda. Sem número e sem rolar: `LineupInitiativeRequired`.

A seta e o botão ficam desligados na batalha teste, como o Invocar de hoje.

Sem cenas, o seletor diz para cadastrar em Cenas.

## Fora deste corte

- Cena para o jogador
- Iniciativa salva dentro da cena
- Substituir a fila ao invocar

## Testes

Unidade de `LineupInvokeMessage.Format` e de `lineupRowsReady`:

- `Format_ListaQuemEntrou`
- `Format_JogadorJaNaFila_ContinuaNaMensagem`
- `Format_NinguemEntrou_SoListaQuemJaEstava`
- `lineupRowsReady_ExigeNumeroOuRolagem`

Regressão do serviço:

- `Create_ValidRequest_ReturnsLineupWithMembers`
- `Create_EmptyName_ThrowsDomainException`
- `Create_NoMembers_ThrowsDomainException`
- `Create_DuplicateSheet_ThrowsDomainException`
- `Create_SheetFromAnotherCampaign_ThrowsDomainException`
- `List_ReturnsOnlyThisCampaign`
- `Update_ReplacesNameAndMembers`
- `Delete_RemovesLineup_KeepsSheets`
- `InvokeLineup_AddsBesideExistingCombatants`
- `InvokeLineup_PlayerAlreadyIn_SkipsOnlyThatPlayer`
- `InvokeLineup_RollsInitiative_WhenAsked`
- `InvokeLineup_MembersMismatch_ChangesNothing`

Regressão da tela:

- `mestre_Seta_OfereceFichaECena`
- `cenas_CriarEditarExcluir_ChamaAApi`
