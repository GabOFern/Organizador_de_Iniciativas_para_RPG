# Modal de imagem do mestre

Com muitas imagens, o cadastro no fim da aba obriga o mestre a rolar até embaixo para incluir ou alterar. O cadastro sai da lista e passa para um modal aberto a partir do topo.

O jogador não vê esse controle. A lista, o olho, o remover e a imagem em tela cheia continuam como estão.

## Botão

Na aba do mestre, logo abaixo do título **Imagens** e acima dos filtros e da lista, há o botão **Nova imagem** (`sceneNewLabel`). Ele aparece também quando a lista está vazia.

## Modal

O botão abre um diálogo (`role="dialog"`, `aria-modal="true"`) por cima da aba. O fundo usa o modal já existente. A camada fica acima da aba (`z-index` 55) e abaixo da imagem em tela cheia (`z-index` 60).

Campos, os mesmos de hoje:

- título
- tipo
- link da imagem ou arquivo (`jpeg`, `png`, `webp` ou `gif`), um dos dois na inclusão
- na edição, o link vazio mantém a imagem atual (placeholder "Deixe vazio para manter")

| Abertura | Título do diálogo | Campos | Botão de envio |
| --- | --- | --- | --- |
| Nova imagem | `sceneNewLabel` | vazios | Incluir |
| Editar na linha | `sceneEditDialogLabel` ("Editar imagem") | título e tipo da imagem; link e arquivo vazios | Salvar |

Tipo `Uncategorized` continua sem valor selecionado, para o mestre escolher um tipo atribuível.

O erro de validação ou de gravação aparece dentro do modal. Erro de carregar, visibilidade ou remover continua na aba, com o modal fechado.

Fechar sem gravar: **Cancelar**, clique no fundo, ou Escape. Escape fecha primeiro a imagem em tela cheia, depois o modal, e só então a aba.

Gravar com sucesso fecha o modal e atualiza a lista. Remover a imagem que está aberta no modal também fecha o modal.

## Fora deste corte

- Modal para o jogador
- Arrastar para reordenar
- Mostrar a miniatura atual dentro do modal de edição

## Testes

Unitários de `sceneEditorHeading` e `sceneEditorSubmitLabel`:

- `sceneEditorHeading_Criar_UsaNovaImagem`
- `sceneEditorHeading_Editar_UsaEditarImagem`
- `sceneEditorSubmitLabel_Criar_Incluir_Editar_Salvar`

Regressão da aba:

- `mestre_NovaImagem_NoTopo_AbreModalVazio_EInclui`
- `mestre_Editar_AbreModalPreenchido_ESalva`
- `mestre_Escape_FechaModalAntesDaAba`
- `jogador_NaoVeNovaImagem` (o teste do jogador que já existe passa a garantir a ausência do botão)
