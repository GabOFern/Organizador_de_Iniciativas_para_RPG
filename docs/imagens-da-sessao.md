# Imagens da sessão

Os jogadores veem imagens que o mestre coloca na campanha, por exemplo um cenário. A lista fica disponível o tempo todo no link público, com batalha em preparo, em andamento ou nenhuma batalha aberta.

## Como encaixa no que já existe

O jogador entra em `/publico/{token}` (`PublicBattlePage`). Esse token é o da campanha, não o de uma batalha. Sem combate, a página mostra a espera (“Não há combate em andamento.”). Com combate, mostra a fila. O SignalR já coloca esse visitante no grupo `battle:{token}:public` nos dois casos, via `JoinBattle`.

A imagem não pode morar na batalha. Se morasse, sumiria ao finalizar o combate e não apareceria na espera. Ela mora na campanha e continua até o mestre removê-la.

O mestre inclui cada imagem de um destes jeitos:

- cola uma URL `http` ou `https`, no mesmo formato da imagem da ficha
- escolhe um arquivo do computador

O arquivo vai para o banco, na própria linha da imagem, como BLOB. A miniatura e a tela cheia leem os mesmos bytes; o tamanho muda só no CSS. A lista e o SignalR carregam só título e endereço de leitura, nunca o arquivo inteiro.

Abrir uma imagem é local: cada pessoa escolhe o que olhar no próprio aparelho. Incluir ou remover uma imagem atualiza a lista de todo mundo que está no link.

## Experiência

Um botão fixo na borda direita da tela, com o rótulo **Imagens**. Ele aparece na página pública (espera e combate) e no shell do mestre (batalha, fichas e modificadores).

O botão abre uma aba na mesma borda, por cima do conteúdo, sem reorganizar a fila. A aba lista as imagens da campanha, da mais antiga para a mais nova:

- miniatura quadrada da imagem
- título ao lado

A aba vazia diz “Nenhuma imagem nesta sessão.”

Um botão **Fechar** na aba esconde a lista e deixa só o botão da borda.

Clicar na miniatura ou no título abre a imagem na tela inteira, no computador e no celular. A imagem cabe na viewport (`object-fit: contain`) sobre um fundo escuro. Um botão **Fechar imagem**, com área de toque de pelo menos 44px, volta para a tela de baixo. A aba lateral permanece como estava. No teclado, Escape fecha primeiro a imagem aberta e, se não houver imagem aberta, fecha a aba.

No mestre, a mesma aba também inclui o cadastro:

- título
- URL da imagem ou arquivo do computador (`jpeg`, `png`, `webp` ou `gif`)
- botão para incluir
- botão para remover cada item

Os dois campos de imagem ficam visíveis. A inclusão exige o título e exatamente uma origem: URL preenchida ou arquivo escolhido.

O jogador não vê esses controles. O mestre pode abrir a imagem do mesmo jeito, para conferir o que os jogadores verão.

## Modelo

Nova entidade `CampaignScene`, ligada à campanha com exclusão em cascata:

| Campo | Regra |
| --- | --- |
| `Id` | identificador |
| `CampaignId` | campanha dona |
| `Title` | obrigatório, até `SceneRules.MaxTitleLength` (120) |
| `ImageUrl` | preenchida só na origem URL: `http` ou `https`, até `SceneRules.MaxImageUrlLength` (1000) |
| `ImageContent` | preenchido só na origem arquivo: bytes da imagem |
| `ImageContentType` | `image/jpeg`, `image/png`, `image/webp` ou `image/gif`, junto com `ImageContent` |
| `SortOrder` | ordem de inclusão, começando em 0 |
| `CreatedAtUtc` | criação |

Cada linha tem uma origem só. URL e arquivo ao mesmo tempo, ou nenhum dos dois, são inválidos. O arquivo aceito tem no máximo `SceneRules.MaxImageBytes` (4 MB) e o tipo é conferido pelos bytes iniciais, não só pela extensão.

No máximo `SceneRules.MaxScenesPerCampaign` (30) imagens por campanha. Título vazio, origem ausente ou dupla, URL fora de `http`/`https`, tipo não aceito, arquivo grande demais e campanha cheia geram mensagem de domínio nomeada, no mesmo estilo de `DomainMessages`.

## API

Leitura pública, sem login, identificada só pelo token da campanha:

- `GET /api/public/campaigns/{token}/scenes` → lista `{ id, title, imageUrl, sortOrder }`
- `GET /api/public/campaigns/{token}/scenes/{id}/image` → bytes da imagem gravada, com o `Content-Type` salvo

Na lista, `imageUrl` é o endereço que a tela usa na miniatura e na imagem aberta. Para URL externa, é o endereço colado. Para arquivo, é o caminho público `/api/public/campaigns/{token}/scenes/{id}/image`. A resposta da lista não traz `ImageContent`.

Alteração só com o JWT do mestre daquela campanha:

- `GET /api/scenes` → a mesma lista da campanha autenticada
- `POST /api/scenes` em `multipart/form-data`, com `title` e ou `imageUrl` ou `file` → inclui no fim e devolve a lista
- `DELETE /api/scenes/{id}` → remove a linha, inclusive os bytes, e devolve a lista

Uma imagem de outra campanha responde como não encontrada. O token público continua sendo só identificador de leitura.

## Tempo real

Novo evento SignalR `ScenesUpdated`, com a lista completa. O `BattleNotifier` envia para os grupos público e do mestre do token da campanha. `JoinBattle` e `JoinBattleMaster` também mandam a lista atual para quem acabou de entrar, inclusive na espera.

A página pública carrega a lista pelo GET ao abrir e substitui pelo evento quando ele chegar. Quem inclui ou remove usa a lista devolvida pela API na hora, sem esperar o hub.

## Fora deste corte

- O mestre forçar uma imagem na tela de todos ao mesmo tempo
- Reordenar arrastando
- Legenda além do título
- Imagens somem ao acabar a batalha
- Arquivo fora de `jpeg`, `png`, `webp` e `gif`
