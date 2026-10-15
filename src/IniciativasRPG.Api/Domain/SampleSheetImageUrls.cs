namespace IniciativasRPG.Api.Domain;

/// <summary>
/// URLs antigas (Wikimedia genéricas) que o seed chegou a gravar por engano.
/// Usadas só para limpar fichas que não são mais do catálogo de exemplo.
/// </summary>
public static class SampleSheetImageUrls
{
    /// <summary>URLs que o seed antigo aplicou a criaturas erradas.</summary>
    public static readonly string[] LegacyCatalogUrls =
    [
        "https://upload.wikimedia.org/wikipedia/commons/1/16/Redon_crying-spider.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/d/db/DnD_kobold.png",
        "https://upload.wikimedia.org/wikipedia/commons/e/e9/DnD_Spectre.png",
        "https://upload.wikimedia.org/wikipedia/commons/f/f9/DnD_Ghoul.png",
        "https://upload.wikimedia.org/wikipedia/commons/b/b2/DnD_skelleton.png",
        "https://upload.wikimedia.org/wikipedia/commons/c/ce/DnD_treant.png",
        "https://upload.wikimedia.org/wikipedia/commons/9/9a/DnD_Goblin.png",
        "https://upload.wikimedia.org/wikipedia/commons/e/e4/DnD_Invisible_stalker.png",
        "https://upload.wikimedia.org/wikipedia/commons/d/d0/DnD_Hobgoblin.png",
        "https://upload.wikimedia.org/wikipedia/commons/b/b7/DnD_Ogre.png",
        "https://upload.wikimedia.org/wikipedia/commons/b/be/DnD_Gargoyle.png",
        "https://upload.wikimedia.org/wikipedia/commons/e/e8/DnD_Lycantrop.png",
        "https://upload.wikimedia.org/wikipedia/commons/b/b0/DnD_Ochre_Jelly.png",
        "https://upload.wikimedia.org/wikipedia/commons/d/d0/DnD_Orc.png",
        "https://upload.wikimedia.org/wikipedia/commons/d/d8/DnD_PurpleWorm.png",
        "https://upload.wikimedia.org/wikipedia/commons/f/f4/DnD_Vampire.png",
        "https://upload.wikimedia.org/wikipedia/commons/f/ff/Magic_Circle.svg",
        "https://upload.wikimedia.org/wikipedia/commons/0/05/DnD_Wights.png",
        "https://upload.wikimedia.org/wikipedia/commons/0/01/DnD_Mummy.png",
    ];

    public static bool IsLegacyCatalogUrl(string? url) =>
        !string.IsNullOrWhiteSpace(url)
        && LegacyCatalogUrls.Contains(url.Trim(), StringComparer.Ordinal);
}
