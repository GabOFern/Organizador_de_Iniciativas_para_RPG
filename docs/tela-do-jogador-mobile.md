# Tela do jogador no celular

O jogador abre `/publico/{token}` no celular, em pé ou deitado, só para ver a fila de iniciativa e as imagens. Não edita ficha, não aplica dano e não abre o painel tático.

Esta spec muda a disposição dessa página em tela pequena. O computador e o tablet largo continuam com a grade de cartões de hoje. O mestre não ganha um layout novo.

## O que a tela faz hoje

`PublicBattlePage` mostra um cabeçalho alto (título, frase de somente leitura, tema e voltar) e, com combate, uma grade de `CombatantCard` em modo leitura. Cada cartão é um bloco: retrato 16/10, nome, iniciativa, vida, CA e ícones de modificador. Abaixo de 640px a grade vira uma coluna, mas o cartão continua alto. O turno atual ainda cresce com `scale`, o que empurra o conteúdo para fora da tela. Sem combate, só aparece a espera.

O jogador não vê o botão **Detalhes**. Vida oculta continua `???`.

As imagens da sessão descritas em `docs/imagens-da-sessao.md` ainda não existem na tela. Quando existirem, no celular elas seguem a posição definida aqui, não uma aba lateral que cubra a fila.

## Por que mudar a disposição

Na mesa a pessoa olha o celular por um instante e volta para o jogo. Em pé, a largura é curta e a altura é longa: a fila precisa ser uma lista, com o turno atual sempre visível. Deitado, a altura é curta e a largura sobra: a fila fica numa coluna e o retrato de quem está selecionado ocupa o resto.

Rastreadores usados no celular fazem o mesmo: em pé, uma lista e o combatente ativo fixo; deitado, a ordem de um lado e o detalhe do outro. Alvos de toque ficam em pelo menos 44px, que já é `--touch-min`. Informação que só aparece no hover não conta, porque o dedo não tem hover.

## Onde vale

Há dois modos, definidos uma vez em propriedades CSS nomeadas, não repetidos como números soltos nos componentes.

| Modo | Condição |
| --- | --- |
| Celular em pé | largura da viewport até `--player-phone-max` (767px) |
| Celular deitado | `orientation: landscape` e altura da viewport até `--player-phone-landscape-max` (500px) |
| Como hoje | qualquer viewport maior que esses dois limites |

Tablet em paisagem larga e desktop permanecem na grade atual. Girar o aparelho troca o modo sem recarregar a página e sem perder o snapshot do SignalR.

A página usa `100dvh` onde precisar da altura visível e respeita `env(safe-area-inset-*)`, para o entalhe e a barra do sistema não cobrirem botão nem a faixa do turno.

## Em pé

O cabeçalho vira uma faixa: nome curto da aplicação, seletor de tema e **Voltar às campanhas**. A frase “somente leitura” sai. A faixa cabe numa linha que pode quebrar em duas, sem rolar na horizontal.

Abaixo dela, uma faixa fixa (**Agora**) mostra só o combatente do turno, se houver e se não estiver morto: miniatura, nome e iniciativa. Ela permanece visível enquanto a lista rola. Se todos estiverem mortos ou não houver turno, a faixa não aparece.

A fila é uma lista vertical, um combatente por linha, na ordem já recebida:

- miniatura quadrada
- nome, que pode quebrar em até duas linhas e não empurra a linha para o lado
- iniciativa, vida (`atual/máximo` ou `???`) e CA
- o texto **Turno** na linha de quem joga
- morto continua legível como morto, com o mesmo escurecimento de hoje

A linha inteira tem altura de toque de pelo menos `--touch-min`. Não há botão de dano, cura, matar, reviver ou detalhes.

Tocar a miniatura abre o retrato daquele combatente na viewport, com `object-fit: contain` e fundo escuro. **Fechar imagem** tem área de pelo menos `--touch-min` e volta para a lista. Escape faz o mesmo. Sem retrato, a miniatura não abre nada; a inicial do nome continua no lugar da imagem.

Quando o turno muda, a linha atual entra na área visível, sem animação de escala. Se a imagem ampliada estiver aberta, a lista não rola por baixo.

Modificadores continuam ícones com a duração. O nome completo do modificador não depende de hover: um toque no ícone mostra o mesmo texto que hoje está no `title`.

Não há rolagem horizontal. O turno atual não usa `transform: scale`.

## Deitado

O cabeçalho fica na mesma faixa baixa do modo em pé.

O miolo é duas colunas:

- esquerda, cerca de 42% da largura e no mínimo 11rem: a mesma lista compacta, rolando só nessa coluna
- direita: o retrato grande de quem está selecionado, nome, iniciativa, vida e CA

Quem está selecionado começa sendo o combatente do turno. Tocar outra linha troca o painel da direita, sem abrir outra página. Tocar de novo a miniatura da lista, ou o retrato grande, abre a mesma imagem em tela cheia do modo em pé.

A faixa **Agora** não se repete: a coluna da direita já é esse destaque. A linha do turno na lista continua marcada.

A coluna da direita não fica vazia se não houver imagem: mostra a inicial do nome no mesmo estilo do cartão.

## Espera e erro

Sem combate, os dois modos mostram só a mensagem que a API já manda (“Não há combate em andamento.” ou a mensagem do snapshot). Não há lista vazia nem cartão fantasma.

Erro de carga continua o texto já exibido hoje, visível nos dois modos, sem cobrir o botão de voltar.

## Imagens da sessão

Enquanto `docs/imagens-da-sessao.md` não estiver na tela, esta spec não cria o botão **Imagens** nem a lista de cenas.

Quando essa lista existir, no celular ela não abre numa aba da borda direita:

- em pé, **Imagens** fica fixo no canto inferior direito, acima da safe area, com alvo de `--touch-min`
- deitado, o mesmo botão fica no pé da coluna da lista, para não cobrir o retrato
- a lista abre por baixo, em folha, sem reorganizar a fila: em pé até 70% da altura visível, deitado até 50%
- o restante da experiência (miniatura e título, tela cheia, **Fechar**, **Fechar imagem**, Escape) segue `docs/imagens-da-sessao.md`

No computador, a aba lateral dessa outra spec permanece.

## Fora deste corte

- Redesenhar batalha, fichas ou modificadores do mestre
- Mostrar linhas da ficha, ataques ou magias ao jogador
- Alterar a API, o snapshot ou o que a vida oculta esconde
- Implementar o cadastro de imagens da sessão
- Gesture de pinça, arrastar a fila ou guardar preferência de tema fora do que já existe

## Como implementar

Quatro agentes, nesta ordem. Cada um lê esta spec. Nenhum altera a spec.

1. Implementar só o que está neste documento: layout da página pública nos dois modos de celular, ampliação do retrato e a posição futura do botão de imagens da sessão se esse botão já existir no código.
2. Conferir a implementação contra os requisitos abaixo e listar o que passou e o que faltou.
3. Executar os requisitos no navegador, nos viewports da tabela de teste, e registrar o resultado de cada um.
4. Confirmar que a página do mestre em 390px e em 1280px continua utilizável, e que `GET /api/public/campaigns/{token}` responde como antes, sem campo novo nem campo removido.

## Requisitos testáveis

Larguras de referência: 390×844 (em pé), 844×390 (deitado), 360×800 (em pé estreito), 1280×800 (computador).

| ID | Onde | Esperado |
| --- | --- | --- |
| PJ-01 | 390×844 com combate | Uma lista, uma linha por combatente. Sem grade de cartões altos. Sem rolagem horizontal. |
| PJ-02 | 390×844 | A faixa **Agora** mostra nome e iniciativa de quem está no turno e continua visível ao rolar a lista. |
| PJ-03 | 390×844 | Cada linha mostra miniatura ou inicial, nome, iniciativa, vida ou `???`, CA. A do turno diz **Turno**. Morto permanece distinguível. |
| PJ-04 | 390×844 | Não há controle de dano, cura, matar, reviver ou detalhes. |
| PJ-05 | 390×844 | Tocar a miniatura de quem tem imagem abre essa imagem contida na tela. **Fechar imagem** e Escape fecham. Sem imagem, o toque na inicial não abre tela cheia. |
| PJ-06 | 844×390 com combate | Lista à esquerda e retrato grande à direita. A faixa **Agora** não aparece. A linha do turno continua marcada. |
| PJ-07 | 844×390 | Tocar outra linha troca o retrato da direita. A imagem em tela cheia ainda abre e fecha. |
| PJ-08 | 360×800 e 844×390 | Voltar, tema e fechar imagem têm ao menos 44px no lado menor. Nenhum texto obrigatório fica cortado fora da tela. |
| PJ-09 | Girar de 390×844 para 844×390 durante o combate | A ordem e o turno são os mesmos. A conexão ao vivo não exige recarregar. |
| PJ-10 | 390×844 e 844×390 sem combate | Só a mensagem de espera. Sem linha de combatente. |
| PJ-11 | 1280×800 | A grade de cartões de hoje permanece. O cabeçalho público atual permanece. |
| PJ-12 | Mestre em 390×800 e em 1280×800 | Batalha, fichas e modificadores abrem e dá para usar o controle principal de cada uma. Nada deste corte remove esses controles. |
| PJ-13 | `GET` público da campanha | O corpo do snapshot mantém os campos atuais. Vida oculta no público continua `???` na tela. |
| PJ-14 | Modificador na linha, 390×844 | O toque no ícone mostra o nome. Não é preciso hover. |
