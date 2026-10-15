namespace IniciativasRPG.Api.Domain;

/// <summary>
/// Conteúdo canônico da ficha única "Foco da Canção" (Falsa Hidra / Desaparecidos).
/// </summary>
public static class SongFocusSheetContent
{
    public const string SheetName = "Foco da Canção";
    public const string CompanionSheetName = "Falsa Hidra";
    public const int MaxHp = 30;
    public const int BaseAc = 15;

    public static readonly IReadOnlyList<string> LegacyNames =
    [
        "Foco da Canção — Pavor",
        "Foco da Canção — Recomposição",
        "Foco da Canção — Ruína",
    ];

    public static readonly IReadOnlyList<(SheetFeatureKind Kind, string Title, string Text)> Features =
    [
        (SheetFeatureKind.Note, "Papel",
            "Parte da Falsa Hidra. Não age na própria iniciativa: um foco ativo canta no início do turno dela. Na batalha, invoque esta ficha até 3 vezes (uma cópia por foco)."),
        (SheetFeatureKind.Trait, "Ponto focal",
            "Cada cópia tem CA 15 e 30 PV. Destruí-la remove aquele foco do combate."),
        (SheetFeatureKind.DifficultyClass, "CD focal",
            "14 + número de focos ativos, máximo 17. Alcance 18 m; o alvo precisa ouvir a fonte."),
        (SheetFeatureKind.Trait, "Gatilho",
            "No início do turno da Hidra, se houver pelo menos um foco ativo, um deles canta uma vez. Não gasta ação da Hidra. Com vários focos, a Hidra escolhe qual canta."),
        (SheetFeatureKind.Trait, "Silenciar",
            "Criatura adjacente: ação e teste de Arcana, Atuação ou Religião CD 16 para silenciar permanentemente aquele foco neste combate."),
        (SheetFeatureKind.Trait, "Ruína",
            "Canção focal: quem ouve a até 18 m faz Sabedoria contra a CD focal. Falha: 3d8 psíquico; sucesso: metade."),
        (SheetFeatureKind.Trait, "Recomposição",
            "Canção focal: a Hidra recupera 15 PV + 5 por foco ativo, sem passar do máximo."),
        (SheetFeatureKind.Trait, "Pavor",
            "Canção focal: quem ouve a até 18 m faz Sabedoria contra a CD focal. Falha: amedrontado da Hidra até o fim do próprio próximo turno."),
        (SheetFeatureKind.Trait, "Amedrontado",
            "Desvantagem em ataques e testes de atributo enquanto vê a Hidra; não pode se aproximar por vontade. Testes de resistência não sofrem desvantagem."),
        (SheetFeatureKind.Trait, "Ácido",
            "Ácido 15 ou mais na rodada impede a cura de Recomposição (focal ou lendária). Não cancela Ruína nem Pavor."),
        (SheetFeatureKind.Trait, "Limite por rodada",
            "Cada criatura só sofre uma Ruína e um Pavor por rodada. A cura de Recomposição não é limitada por essa regra."),
    ];

    public static bool IsLegacyName(string name) =>
        LegacyNames.Any(legacy => string.Equals(legacy, name, StringComparison.Ordinal));

    public static bool IsCanonicalOrLegacyName(string name) =>
        string.Equals(name, SheetName, StringComparison.Ordinal) || IsLegacyName(name);
}
