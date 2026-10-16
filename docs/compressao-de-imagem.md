# Compressão ao gravar imagem

Ficha e imagem da sessão recusam o arquivo inteiro quando ele passa de 4 MB, antes de converter. O teto de 4 MB continua valendo para o que fica no banco. O envio pode ser maior, e a API reduz a imagem na hora de salvar.

Vale para os três caminhos que gravam bytes: arquivo da ficha, arquivo da imagem da sessão e link baixado pelo servidor.

## Limites

Os números moram em `SheetRules`. `SceneRules` aponta para os mesmos valores.

| Constante | Valor | Uso |
| --- | --- | --- |
| `MaxImageUploadBytes` | 20 MB | tamanho máximo aceito no pedido e no download do link |
| `MaxImageBytes` | 4 MB | tamanho máximo gravado |
| `MaxImageEdgePixels` | 2560 | lado maior depois da redução; imagem menor não é ampliada |
| `WebpQualityHigh` | 90 | primeira qualidade com perda |
| `WebpQualityFloor` | 80 | última qualidade com perda |

`MaxImageRequestBytes` passa a ser `MaxImageUploadBytes`, nos dois controllers.

## Ordem

`ImageStoreOptimizer.Prepare` recebe os bytes já lidos:

1. Acima de `MaxImageUploadBytes` → `DomainMessages.SheetImageUploadTooLarge` ("A imagem passa de 20 MB.").
2. Vazio → `DomainMessages.SheetImageRequired`.
3. Tipo fora de jpeg, png, webp e gif, conferido por `SheetRules.DetectImageContentType` → `DomainMessages.SheetImageTypeInvalid`.
4. Se o arquivo já cabe em `MaxImageBytes`, gravar os bytes originais e o tipo detectado. Não reencoda. Gif animado que já cabe continua animado.
5. Caso contrário, decodificar. Bytes com assinatura de imagem que não decodificam → `SheetImageTypeInvalid`. Gif com mais de um quadro usa só o primeiro.
6. Se algum lado passa de `MaxImageEdgePixels`, reduzir com `ResizeMode.Max` e `Lanczos3`, sem ampliar. A proporção se mantém.
7. Gravar o primeiro candidato que cabe em `MaxImageBytes`, nesta ordem:
   - WebP sem perda
   - WebP com perda em `WebpQualityHigh`
   - WebP com perda em `WebpQualityFloor`
8. Se nenhum cabe → `DomainMessages.SheetImageTooLarge` ("A imagem passa de 4 MB.").

O resultado traz os bytes e o `Content-Type` (`image/webp` quando houve conversão).

## Tela

O navegador só conhece o arquivo antes da conversão. A checagem local usa `MaxImageUploadBytes`. Arquivo de 4 MB e 1 byte segue para a API. Arquivo acima de 20 MB mostra "A imagem passa de 20 MB." e não envia. A mesma função serve a ficha e a aba de imagens.

## Fora deste corte

- Aumentar os 4 MB gravados
- Comprimir no navegador
- Preservar animação de gif que não cabe em 4 MB
- Recomprimir arquivos que já cabem em 4 MB

## Testes

Unitários de `ImageStoreOptimizer`, com limites pequenos para não depender de um arquivo de 4 MB:

- `Prepare_WithinStoredLimit_KeepsOriginalBytes`
- `Prepare_AboveUploadLimit_ThrowsUploadTooLarge`
- `Prepare_UnrecognizedBytes_ThrowsTypeInvalid`
- `Prepare_Oversized_FitsStoredLimit_AndLongestEdge`
- `Prepare_WhenLosslessFits_MatchesResizedPixels`
- `Prepare_WhenLosslessExceedsStored_StoresLossyWithinLimit`
- `Prepare_AnimatedGifAboveStoredLimit_KeepsFirstFramePixels`
- `ProductionLimits_Stored4Mb_Upload20Mb`

Regressão do caminho que hoje devolve "A imagem passa de 4 MB.":

- `SetImage_SourceLargerThanStoredLimit_PersistsBytesWithinLimit` — a ficha grava o resultado do otimizador, não o arquivo original
- `Create_FileLargerThanStoredLimit_PersistsBytesWithinLimit` — a imagem da sessão faz o mesmo
- `imageExceedsUploadLimit` — 4 MB + 1 byte passa; 20 MB + 1 byte não
