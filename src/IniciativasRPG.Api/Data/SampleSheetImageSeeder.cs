using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Data;

/// <summary>
/// Atualiza imagens no banco (sem migration):
/// - 6 exemplos: arte local se ainda não tiverem binário próprio ou só URL legada;
/// - remove URLs genéricas erradas do seed antigo em qualquer ficha;
/// - não grava arte do catálogo de campanha.
/// </summary>
public static class SampleSheetImageSeeder
{
    public static async Task ApplyAsync(AppDbContext db, CancellationToken ct = default)
    {
        var sheets = await db.Sheets
            .Include(s => s.Image)
            .ToListAsync(ct);

        var sampleArt = SampleNpcSheetContent.All
            .ToDictionary(s => s.Name, s => s.ArtFileName, StringComparer.Ordinal);
        var changed = 0;

        foreach (var sheet in sheets)
        {
            if (!sampleArt.TryGetValue(sheet.Name, out var artFile))
            {
                if (SampleSheetImageUrls.IsLegacyCatalogUrl(sheet.ImageUrl))
                {
                    sheet.ImageUrl = null;
                    changed++;
                }

                continue;
            }

            if (!ShouldReplaceImage(sheet))
            {
                continue;
            }

            if (!SampleSeedArt.TryLoad(artFile, out var bytes, out var contentType))
            {
                continue;
            }

            sheet.ImageUrl = null;
            if (sheet.Image is null)
            {
                sheet.Image = new SheetImage
                {
                    SheetId = sheet.Id,
                    Content = bytes,
                    ContentType = contentType,
                };
            }
            else
            {
                sheet.Image.Content = bytes;
                sheet.Image.ContentType = contentType;
            }

            changed++;
        }

        if (changed > 0)
        {
            await db.SaveChangesAsync(ct);
        }
    }

    /// <summary>
    /// Substitui se não há binário, ou se só há URL legada/placeholder.
    /// Preserva upload/URL customizada do mestre.
    /// </summary>
    private static bool ShouldReplaceImage(Sheet sheet)
    {
        if (sheet.Image is not null)
        {
            // Já tem arquivo no banco: só troca se a URL externa antiga ainda estiver setada
            // (caso inconsistente). Caso contrário preserva o binário do mestre.
            return SampleSheetImageUrls.IsLegacyCatalogUrl(sheet.ImageUrl);
        }

        var url = sheet.ImageUrl?.Trim() ?? string.Empty;
        if (url.Length == 0)
        {
            return true;
        }

        if (SampleSheetImageUrls.IsLegacyCatalogUrl(url) || IsLowQualityPlaceholder(url))
        {
            return true;
        }

        // URL customizada do mestre: não sobrescreve.
        return false;
    }

    private static bool IsLowQualityPlaceholder(string url) =>
        url.Contains("pinimg.com", StringComparison.OrdinalIgnoreCase)
        || url.Contains("encrypted-tbn", StringComparison.OrdinalIgnoreCase)
        || url.Contains("gstatic.com", StringComparison.OrdinalIgnoreCase);
}
