# Filtro de fichas

O repositório de fichas já esconde pelo nome. Falta a categoria. Na cena, a lista de fichas para marcar não tem filtro nenhum, e com muitas fichas o mestre não acha jogadores ou o cemitério.

A categoria é o tipo da ficha: Jogador, Criatura ou NPC. Classe (Guerreiro, Bardo) fica de fora deste corte.

O filtro só esconde. Não desmarca, não apaga e não muda o que será gravado.

## Repositório de fichas

Na lista, ao lado do nome, entra **Filtrar por categoria** (`sheetFilterCategoryLabel`). **Filtrar por nome** (`sheetFilterNameLabel`) continua.

| Controle | Valor inicial | Opções |
| --- | --- | --- |
| Nome | vazio | texto livre |
| Categoria | Todas (`sheetFilterAllCategoriesLabel`) | Jogador, Criatura, NPC |

Os dois valem juntos. O nome ignora maiúsculas e espaços nas pontas e procura no nome da ficha e no nome do jogador. A categoria compara o tipo. Todas com o nome vazio mostra a lista inteira.

Sem fichas na campanha: "Nenhuma ficha cadastrada." Com fichas, mas nenhuma no filtro: `sheetFilterEmptyMessage`.

## Criação e edição da cena

No formulário da cena, acima da lista, os mesmos dois controles. A lista usa as mesmas regras.

O filtro só esconde a linha. A quantidade de uma ficha oculta permanece. Gravar inclui essa ficha. Limpar o filtro mostra o número de novo.

Sem fichas na campanha, o formulário diz "Nenhuma ficha cadastrada." Com fichas fora do filtro: `sheetFilterEmptyMessage`.

## Fora deste corte

- Filtrar a lista de cenas já gravadas
- Filtrar por classe
- Filtro no servidor

## Testes

Unidade de `filterSheets`:

- `filterSheets_Nome_IgnoraMaiusculasEEspacos`
- `filterSheets_NomeDoJogador_EncontraAFicha`
- `filterSheets_Categoria_RestringeOTipo`
- `filterSheets_NomeECategoria_ExigeOsDois`
- `filterSheets_TodasSemTexto_RetornaTudo`

Regressão das telas:

- `fichas_FiltroCategoria_EscondeOutrosTipos`
- `cenas_Quantidade_GravaCopiasEMantemOculta`
