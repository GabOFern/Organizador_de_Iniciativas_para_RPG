# Fichas de campanha editáveis e boot vazio

Quem clona o código **não** herda conteúdo da campanha Desaparecidos (Foco da Canção, Lysander, Sammy, Falsa Hidra, arte SRD, etc.).

Na primeira subida o banco fica **sem campanhas**. O mestre cria a campanha pela UI. Toda campanha (nova ou já existente no boot) recebe **somente** as 6 fichas da batalha simulada.

## Boot (`DbSeeder`)

Permitido:

1. `MigrateAsync`
2. `SampleNpcSheetSeeder.ApplyAsync` — as 6 fichas por campanha existente, idempotente por nome
3. `SampleSheetImageSeeder.ApplyAsync` — arte **apenas** para nomes de `SampleNpcSheetContent` (e limpeza de URL legada nessas / genéricas, sem catálogo de campanha)

Proibido no boot:

- Criar campanha seed (`CampaignSeed` / "Campanha inicial") — **remover** esse bloco do `DbSeeder`
- Chamar `SongFocusSheetUnifier` — **remover** a chamada; apagar unificador, `SongFocusSheetContent`, testes associados e migration vazia só se não quebrar histórico (a migration já aplicada pode ficar no histórico; o código runtime some)
- Aplicar `CampaignSheetArtCatalog` / arte de criaturas de campanha
- Qualquer create/update de fichas que não sejam as 6 de `SampleNpcSheetContent`

Sem campanhas e sem senha de CampaignSeed: o boot **não falha**. Banco vazio de campanhas é estado válido.

Pode remover `CampaignSeed` de `appsettings.json` / Options / DI se ficar sem uso; atualizar `CONFIGURACAO-E-DEPLOY.md` e `appsettings.Example.json` para não exigir senha de campanha seed.

## Criação de campanha

`CampaignService.CreateAsync`, após gravar a campanha, chama `SampleNpcSheetSeeder.ApplyForCampaignAsync` (e, se fizer sentido no mesmo fluxo, a arte sample só dessas fichas — ou o próximo boot cobre a imagem). Garantir que campanha nova já nasce com as 6 fichas sem reiniciar a API.

## Batalha simulada (permanece hardcoded)

- `SampleNpcSheetContent`, seeder, arte dos 6, `DemoBattleRules` / serviço / tick no front
- Apagar uma das 6 e reiniciar (ou rodar o seeder de novo) recria a faltante

## Conteúdo de campanha do mestre

Foco, Lysander, import SQL, etc. vivem só no banco local de quem importou/editou. Não há código de produto que os reinstale.

Arquivos `Data/SeedArt/` de criaturas de campanha e `CampaignSheetArtCatalog.cs` podem ser removidos se não tiverem mais referência; não é obrigatório apagar JPGs órfãos se o `.csproj` ainda os copia — preferir remover referências e o catálogo.

## Fora deste corte

- CORS, `bkpenv`, unificação de mensagens UI
- Reescrever migrations one-shot antigas já aplicadas
- Tela nova de onboarding além do create de campanha já existente

## Testes

`DbSeeder` / integração leve com `TestDb` ou teste do serviço:

- `Seed_EmptyDatabase_DoesNotCreateCampaign` — após o fluxo de seed, `Campaigns` vazio
- `CreateCampaign_AddsSampleNpcSheets` — `CreateAsync` deixa as 6 fichas na campanha

`SampleNpcSheetSeederTests` / `DemoBattleServiceTests` — continuam verdes

`SampleSheetImageSeeder`:

- `Apply_CampaignCreatureWithoutImage_DoesNotSeedCampaignArt`
- `Apply_SampleNpcWithoutImage_StillSeedsArt`

Remover ou substituir `SongFocusSheetUnifierTests` e `SongFocusSheetContentTests` (código removido).
