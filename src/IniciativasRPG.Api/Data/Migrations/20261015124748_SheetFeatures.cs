using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IniciativasRPG.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class SheetFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SheetFeatures",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    SheetId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Kind = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Text = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SheetFeatures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SheetFeatures_Sheets_SheetId",
                        column: x => x.SheetId,
                        principalTable: "Sheets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SheetFeatures_SheetId",
                table: "SheetFeatures",
                column: "SheetId");

            SeedExistingFeatures(migrationBuilder);
        }

        private static void SeedExistingFeatures(MigrationBuilder migrationBuilder)
        {
            Seed(migrationBuilder, "Aranha de Fase",
            [
                ("Note", "Tipo", "SRD 5.1. Monstruosidade Grande, ND 3."),
                ("Speed", "Deslocamento", "9 m, escalada 9 m."),
                ("Trait", "Furtividade", "+6."),
                ("Sense", "Visão no escuro", "18 m."),
                ("Trait", "Escalada", "Escala qualquer superfície e ignora teias."),
                ("Trait", "Salto etéreo", "Ação bônus: entre o Plano Material e o Etéreo. Não leva a vítima junto."),
                ("Trait", "Veneno", "Constituição CD 11, metade no sucesso. Se o veneno reduzir a 0 PV, o alvo fica estável, envenenado por 1 hora e paralisado enquanto esse veneno durar.")
            ]);

            Seed(migrationBuilder, "Banshee",
            [
                ("Note", "Tipo", "Morto-vivo Médio, ND 4. Resumo da aventura; não está no SRD."),
                ("Speed", "Voo", "12 m, paira."),
                ("Resistance", "Resistência", "ácido, fogo, elétrico, trovejante e dano físico não mágico."),
                ("Immunity", "Imunidade", "frio, necrótico, veneno; amedrontado, enfeitiçado, paralisado e caído."),
                ("Trait", "Visão horripilante", "Quem a vê, Sabedoria CD 13 ou amedrontado."),
                ("Trait", "Uivo", "1/dia. Quem ouve num raio curto, Constituição CD 13. Falha: cai a 0 PV. Sucesso: 3d6 psíquico. Anuncie o uivo antes de usar.")
            ]);

            Seed(migrationBuilder, "Carniçal",
            [
                ("Note", "Tipo", "Ghoul do SRD 5.1. Morto-vivo Médio, ND 1."),
                ("Speed", "Deslocamento", "9 m."),
                ("Immunity", "Imunidade", "veneno; enfeitiçado, exaustão e envenenado."),
                ("Trait", "Garras", "Criatura viva que não seja elfo nem morto-vivo faz Constituição CD 10 ou fica paralisada por 1 minuto. Novo teste no fim de cada turno dela.")
            ]);

            Seed(migrationBuilder, "Esqueleto",
            [
                ("Note", "Tipo", "SRD 5.1. Morto-vivo Médio, ND 1/4."),
                ("Speed", "Deslocamento", "9 m."),
                ("Vulnerability", "Vulnerabilidade", "contundente."),
                ("Resistance", "Resistência", "dano de veneno."),
                ("Immunity", "Imunidade", "exaustão e condição envenenado.")
            ]);

            Seed(migrationBuilder, "Falsa Hidra",
            [
                ("Note", "PV por grupo", "360 (7), 410 (8), 460 (9). Esta ficha está em 7."),
                ("Speed", "Deslocamento", "9 m, escalada 9 m."),
                ("Immunity", "Imunidade", "veneno e envenenado. Sem resistência a armas comuns."),
                ("Legendary", "Resistências lendárias", "3/dia."),
                ("Sense", "Percepção passiva", "19."),
                ("Sense", "Visão no escuro", "36 m."),
                ("Trait", "Multiataque", "três mordidas."),
                ("Trait", "Varredura", "2 ações lendárias. Criaturas a até 3 m, Destreza CD 16. Falha: caído. Sucesso: metade do dano e não cai."),
                ("DifficultyClass", "CD focal", "14 + focos ativos, máximo 17. No início do turno, um foco ativo canta. Alcance 18 m; o alvo precisa ouvir."),
                ("Trait", "Ruína lendária", "até 3 alvos, CD 14, 2d8 psíquico."),
                ("Trait", "Recomposição focal", "cura 15 + 5 por foco. Lendária: cura 10. Ácido 15+ na rodada anula a cura."),
                ("Trait", "Pavor", "Sabedoria, amedrontado até o fim do próximo turno. Lendária: até 3 alvos, CD 14."),
                ("Legendary", "Ações lendárias", "3. Mordida 1, Deslizar 1, Varredura 2, Canção sem foco 1 (uma vez por rodada, CD 14)."),
                ("Trait", "Limite por rodada", "Cada criatura só sofre uma Ruína e um Pavor por rodada."),
                ("Trait", "Focos", "CA 15 e 30 PV. Silenciar: ação e Arcana, Atuação ou Religião CD 16."),
                ("Trait", "Runa", "CA 15 e 25 PV, ou Arcana CD 17. Uma vez por combate, gasta 1 resistência lendária e teleporta até 18 m.")
            ]);

            Seed(migrationBuilder, "Flor Cadavérica",
            [
                ("Note", "Tipo", "Planta Grande, ND 8. Resumo da aventura; não está no SRD."),
                ("Speed", "Deslocamento", "6 m, escalada 6 m."),
                ("Sense", "Percepção às cegas", "36 m; cega além disso."),
                ("Immunity", "Imunidade", "cego e surdo."),
                ("Trait", "Cadáveres", "Começa com 1d6+3 cadáveres e comporta até nove. Ação bônus: consome um corpo para curar 2d10 ou animá-lo como zumbi."),
                ("Trait", "Fedor da morte", "Criaturas próximas, Constituição CD 14 ou incapacitadas até o fim do turno. Mortos-vivos e quem é imune a veneno ignoram."),
                ("Trait", "Tentáculos", "Cada tentáculo pode causar 4d6 de veneno, Constituição CD 14.")
            ]);

            Seed(migrationBuilder, "Foco da Canção — Pavor",
            [
                ("Note", "Papel", "Parte da Falsa Hidra. Canta no início do turno dela, sem gastar ação."),
                ("Trait", "Canto", "Quem ouve a até 18 m faz Sabedoria contra CD 14 + focos ativos (máximo 17). Falha: amedrontado da Hidra até o fim do próprio próximo turno."),
                ("Trait", "Amedrontado", "Desvantagem em ataques e testes de atributo enquanto vê a Hidra; não pode se aproximar por vontade. Testes de resistência não sofrem desvantagem."),
                ("Trait", "Silenciar", "Ação adjacente e Arcana, Atuação ou Religião CD 16.")
            ]);

            Seed(migrationBuilder, "Foco da Canção — Recomposição",
            [
                ("Note", "Papel", "Parte da Falsa Hidra. Canta no início do turno dela, sem gastar ação."),
                ("Trait", "Cura", "A Hidra recupera 15 PV + 5 por foco ativo, sem passar do máximo."),
                ("Trait", "Ácido", "Ácido 15 ou mais na rodada impede essa cura. Não cancela Ruína nem Pavor."),
                ("Trait", "Silenciar", "Ação adjacente e Arcana, Atuação ou Religião CD 16.")
            ]);

            Seed(migrationBuilder, "Foco da Canção — Ruína",
            [
                ("Note", "Papel", "Parte da Falsa Hidra. Não age na própria iniciativa: canta no início do turno dela."),
                ("Trait", "Canto", "Quem ouve a até 18 m faz Sabedoria contra CD 14 + focos ativos (máximo 17). Sucesso: metade do dano."),
                ("Trait", "Silenciar", "Silenciar de vez neste combate: ação adjacente e Arcana, Atuação ou Religião CD 16.")
            ]);

            Seed(migrationBuilder, "Grick",
            [
                ("Note", "Tipo", "SRD 5.1. Monstruosidade Média, ND 2."),
                ("Speed", "Deslocamento", "9 m, escalada 9 m."),
                ("Resistance", "Resistência", "contundente, perfurante e cortante não mágicos."),
                ("Trait", "Furtividade", "Vantagem em Furtividade para se esconder em terreno rochoso."),
                ("Trait", "Tentáculos", "Se os tentáculos acertam, pode usar o bico no mesmo alvo. Não agarra automaticamente.")
            ]);

            Seed(migrationBuilder, "Hulk Umbrático",
            [
                ("Note", "Tipo", "Umber Hulk. Monstruosidade Grande, ND 5. Resumo da aventura; não está no SRD."),
                ("Speed", "Deslocamento", "9 m, escavação 6 m."),
                ("Sense", "Visão no escuro", "36 m."),
                ("Sense", "Sentido sísmico", "18 m."),
                ("Trait", "Escavação", "Atravessa rocha e deixa um túnel."),
                ("Trait", "Olhar confusor", "Quem começa o turno a até 9 m e vê os olhos, Carisma CD 15. Falha: sem reações e comportamento aleatório no d8. Desviar o olhar evita o teste, mas então não vê a criatura."),
                ("Trait", "Multiataque", "duas garras e as mandíbulas.")
            ]);

            Seed(migrationBuilder, "Lysander, o Bibliotecário Noturno",
            [
                ("Speed", "Deslocamento", "9 m."),
                ("Sense", "Visão no escuro", "36 m."),
                ("Sense", "Percepção passiva", "20."),
                ("Legendary", "Resistências lendárias", "4/dia."),
                ("Immunity", "Imunidade", "amedrontado, enfeitiçado e acertos críticos."),
                ("Resistance", "Resistência", "contundente, perfurante e cortante não mágicos."),
                ("Trait", "Regeneração", "20 PV no início do turno, salvo se sofreu ácido ou fogo desde o turno anterior. Use Regeneração 20 e remova-a se ácido ou fogo interromper. Fuga preparada em 93 PV ou menos."),
                ("DifficultyClass", "Conjuração", "Inteligência, CD 23, ataque mágico +15."),
                ("Trait", "Forma acadêmica", "Multiataque: dois bisturis, ou um bisturi e um raio."),
                ("Trait", "Olhar petrificante", "Recarga 5–6. Um alvo a 9 m, Constituição CD 23. Falha: contido; no fim do próximo turno, falha petrifica e sucesso interrompe."),
                ("Trait", "Reanimar os Esquecidos", "Recarga 6. Quatro zumbis ou dois carniçais a até 9 m."),
                ("Trait", "Ação bônus", "Transformar-se ou comandar um morto-vivo a até 36 m. Na forma híbrida, deslocamento 12 m e não lança magia além de truques. Multiataque híbrido: duas garras e uma mordida."),
                ("Legendary", "Ações lendárias", "3. Reposicionar 1, Golpe adicional 1, Ordem silenciosa 1, Distorção da Carne 2 (cura 15), Grito Dissonante 2 (Sabedoria CD 23, amedrontado)."),
                ("Trait", "Contenção deliberada", "Pode deixar um alvo com 1 PV e inconsciente em vez de 0."),
                ("Trait", "Diamante", "Preparado revive Sammy uma vez com 1 PV, se ela morreu há no máximo 1 minuto.")
            ]);

            Seed(migrationBuilder, "Massa de Bocas Tagarelas",
            [
                ("Note", "Tipo", "Gibbering Mouther do SRD 5.1. Aberração Média, ND 2."),
                ("Speed", "Deslocamento", "3 m, natação 3 m."),
                ("Immunity", "Imunidade", "condição caído."),
                ("Sense", "Visão no escuro", "18 m."),
                ("Trait", "Solo aberrante", "3 m ao redor são terreno difícil. Quem começa o turno aí, Força CD 10 ou deslocamento 0 até o próximo turno."),
                ("Trait", "Tagarelice", "Quem ouve a até 6 m no início do turno, Sabedoria CD 10. Falha: sem reações e rola 1d8. 1–4: não faz nada. 5–6: só se move numa direção aleatória. 7–8: um ataque corpo a corpo contra um alvo aleatório ao alcance, ou nada."),
                ("Trait", "Multiataque", "uma mordida e, se puder, o cuspe cegante."),
                ("Trait", "Mordida", "Alvo Médio ou menor atingido: Força CD 10 ou caído. Morto por esse dano é absorvido."),
                ("Trait", "Cuspe cegante", "Recarga 5–6. Ponto a até 4,5 m, explosão de 1,5 m. Destreza CD 13 ou cego até o fim do próximo turno da criatura.")
            ]);

            Seed(migrationBuilder, "Rastejador de Carniça",
            [
                ("Note", "Tipo", "Carrion Crawler. Monstruosidade Grande, ND 2. Resumo da aventura; não está no SRD."),
                ("Speed", "Deslocamento", "9 m, escalada 9 m. Escala como aranha."),
                ("Sense", "Percepção", "+3."),
                ("Sense", "Visão no escuro", "18 m."),
                ("Trait", "Tentáculos paralisantes", "Alcance 3 m. Constituição CD 13 contra o veneno; enquanto envenenado, fica paralisado e repete o teste no fim de cada turno.")
            ]);

            Seed(migrationBuilder, "Revenante",
            [
                ("Note", "Tipo", "Morto-vivo Médio, ND 5. Resumo da aventura; não está no SRD."),
                ("Speed", "Deslocamento", "9 m."),
                ("Resistance", "Resistência", "necrótico e psíquico."),
                ("Immunity", "Imunidade", "veneno; amedrontado, enfeitiçado, exaustão, paralisado, envenenado e atordoado."),
                ("Trait", "Regeneração", "10 PV no início do turno. Fogo ou radiante impedem até o início do turno seguinte."),
                ("Trait", "Multiataque", "dois golpes. Contra o alvo da vingança, cada golpe causa dano contundente extra."),
                ("Trait", "Olhar vingativo", "Contra o alvo da vingança, Sabedoria CD 15; pode paralisar e depois amedrontar."),
                ("Trait", "Corpo destruído", "A alma pode animar outro cadáver humanoide após 24 horas.")
            ]);

            Seed(migrationBuilder, "Runa do Arquimago",
            [
                ("Note", "Papel", "Objeto da Falsa Hidra. Não age."),
                ("Trait", "Desativar", "Criatura adjacente gasta uma ação e passa em Arcana CD 17, ou reduz a runa a 0 PV."),
                ("Trait", "Uso da Hidra", "Se estiver ativa, a Hidra pode gastá-la uma vez, consumindo 1 resistência lendária, para ter sucesso num teste decisivo ou fugir até 18 m quando cairia a 1/4 dos PV ou menos."),
                ("Trait", "Limite", "A runa não cura e não desfaz dano já sofrido.")
            ]);

            Seed(migrationBuilder, "Sammy, a Guarda Silenciosa",
            [
                ("Note", "PV por grupo", "230 (7), 260 (8), 285 (9). Esta ficha está em 7."),
                ("Speed", "Deslocamento", "9 m, escalada 9 m."),
                ("Resistance", "Resistência", "fogo."),
                ("Sense", "Visão no escuro", "18 m."),
                ("Trait", "Deslocamento ilusório", "Ataques contra ela têm desvantagem até ela sofrer dano; a proteção volta no início do próximo turno dela."),
                ("Trait", "Regeneração", "10 PV no início do turno se tiver ao menos 1 PV. Ácido ou fogo desde o turno anterior impedem a cura. Use o modificador Regeneração 10 e remova-o quando o ácido ou o fogo interromper."),
                ("Trait", "Multiataque", "duas garras, ou uma garra e uma investida de cauda."),
                ("Trait", "Recarga compartilhada", "Rajada de Espinhos e Investida Sísmica compartilham recarga 5–6: no máximo uma por turno."),
                ("Trait", "Investida de cauda", "Força CD 17 ou empurrão de 3 m."),
                ("Trait", "Investida sísmica", "Constituição CD 17; falha também derruba."),
                ("Trait", "Salto do Cão-Piscar", "Ação bônus, 2 usos, teleporte de até 9 m. Encerra agarrado, não contido."),
                ("Trait", "Retaliação ígnea", "Reação em quem a acerta a até 1,5 m. Uma reação por rodada."),
                ("Legendary", "Ações lendárias", "2. Reposicionar 1 (move 4,5 m), Garra 2."),
                ("Trait", "Rendição", "Se Lysander for neutralizado ou mandar parar, ela recua ou se rende.")
            ]);

            Seed(migrationBuilder, "Tumular",
            [
                ("Note", "Tipo", "Wight do SRD 5.1. Morto-vivo Médio, ND 3."),
                ("Speed", "Deslocamento", "9 m."),
                ("Resistance", "Resistência", "necrótico; contundente, perfurante e cortante de ataques não mágicos que não sejam de prata."),
                ("Immunity", "Imunidade", "veneno; exaustão e envenenado."),
                ("Sense", "Visão no escuro", "18 m."),
                ("Trait", "Luz solar", "Desvantagem em ataques e em Percepção visual."),
                ("Trait", "Multiataque", "duas espadas longas ou dois arcos longos. Drenar Vida pode substituir um ataque de espada."),
                ("Trait", "Espada longa", "Com as duas mãos: 1d10+2 cortante."),
                ("Trait", "Drenar vida", "Constituição CD 13 ou o máximo de PV cai pelo dano sofrido até um descanso longo. Humanoide morto assim pode erguer-se como zumbi em 24 h, até doze sob controle.")
            ]);

            Seed(migrationBuilder, "Zumbi",
            [
                ("Note", "Tipo", "SRD 5.1. Morto-vivo Médio, ND 1/4. Usado quando Lysander, a Flor Cadavérica ou o covil erguem zumbis."),
                ("Speed", "Deslocamento", "6 m."),
                ("Immunity", "Imunidade", "condição envenenado."),
                ("Sense", "Visão no escuro", "18 m."),
                ("Trait", "Fortitude morta-viva", "Se o dano o reduziria a 0 PV, teste de Constituição CD 5 + o dano, salvo se o dano for radiante ou crítico. Sucesso: fica com 1 PV.")
            ]);

            migrationBuilder.Sql(
                """
                UPDATE "Sheets" SET "Resistances" = NULL
                WHERE "Id" IN (SELECT "SheetId" FROM "SheetFeatures");
                """);
        }

        private static void Seed(
            MigrationBuilder migrationBuilder,
            string sheetName,
            (string Kind, string Title, string Text)[] lines)
        {
            for (var i = 0; i < lines.Length; i++)
            {
                var (kind, title, text) = lines[i];
                var id = Guid.NewGuid().ToString().ToUpperInvariant();
                migrationBuilder.Sql(
                    "INSERT INTO \"SheetFeatures\" (\"Id\", \"SheetId\", \"Kind\", \"Title\", \"Text\", \"SortOrder\") " +
                    "SELECT '" + id + "', \"Id\", '" + kind + "', '" + Sql(title) + "', '" + Sql(text) + "', " + i +
                    " FROM \"Sheets\" WHERE \"Name\" = '" + Sql(sheetName) + "';");
            }
        }

        private static string Sql(string value) => value.Replace("'", "''");

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SheetFeatures");
        }
    }
}
