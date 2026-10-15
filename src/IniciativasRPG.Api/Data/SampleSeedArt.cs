using IniciativasRPG.Api.Domain;

namespace IniciativasRPG.Api.Data;

/// <summary>Carrega ilustrações locais do catálogo de exemplos (Data/SeedArt).</summary>
public static class SampleSeedArt
{
    public static string ArtDirectory
    {
        get
        {
            foreach (var candidate in CandidateDirectories())
            {
                if (Directory.Exists(candidate))
                {
                    return candidate;
                }
            }

            return Path.Combine(AppContext.BaseDirectory, "Data", "SeedArt");
        }
    }

    private static IEnumerable<string> CandidateDirectories()
    {
        yield return Path.Combine(AppContext.BaseDirectory, "Data", "SeedArt");
        yield return Path.Combine(Directory.GetCurrentDirectory(), "Data", "SeedArt");
        // Testes: sobe de bin/Debug/netX.0 até a raiz do repo e aponta para a API.
        yield return Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory,
            "..", "..", "..", "..", "..",
            "src", "IniciativasRPG.Api", "Data", "SeedArt"));
    }

    public static bool TryLoad(string artFileName, out byte[] content, out string contentType)
    {
        content = [];
        contentType = string.Empty;
        var path = Path.Combine(ArtDirectory, artFileName);
        if (!File.Exists(path))
        {
            return false;
        }

        content = File.ReadAllBytes(path);
        contentType = SheetRules.DetectImageContentType(content) ?? SheetRules.JpegContentType;
        return content.Length > 0;
    }
}
