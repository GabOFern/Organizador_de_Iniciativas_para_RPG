namespace IniciativasRPG.Api.Domain;

/// <summary>
/// Arte local para fichas já existentes na campanha (não cria fichas; só atualiza imagem no banco).
/// Lysander, Sammy, Falsa Hidra e Foco da Canção ficam de fora.
/// </summary>
public static class CampaignSheetArtCatalog
{
    public static readonly string[] SkipNames =
    [
        "Lysander, o Bibliotecário Noturno",
        "Sammy, a Guarda Silenciosa",
        "Falsa Hidra",
        SongFocusSheetContent.SheetName,
    ];

    /// <summary>Nome da ficha → arquivo em Data/SeedArt.</summary>
    public static readonly IReadOnlyDictionary<string, string> ArtBySheetName =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["Aranha de Fase"] = "aranha-fase.jpg",
            ["Banshee"] = "banshee.jpg",
            ["Carniçal"] = "carnical.jpg",
            ["Flor Cadavérica"] = "flor-cadaverica.jpg",
            ["Grick"] = "grick.jpg",
            ["Hulk Umbrático"] = "hulk-umbratico.jpg",
            ["Massa de Bocas Tagarelas"] = "massa-bocas.jpg",
            ["Rastejador de Carniça"] = "rastejador.jpg",
            ["Revenante"] = "revenante.jpg",
            ["Runa do Arquimago"] = "runa.jpg",
            ["Tumular"] = "tumular.jpg",
            ["Zumbi"] = "zumbi.jpg",
            ["Orc"] = "orc.jpg",
        };

    public static bool ShouldSkip(string name) =>
        SkipNames.Contains(name, StringComparer.Ordinal);

    public static bool TryGetArtFile(string sheetName, out string artFileName) =>
        ArtBySheetName.TryGetValue(sheetName, out artFileName!);
}
