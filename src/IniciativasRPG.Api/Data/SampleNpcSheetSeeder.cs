using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Data;

/// <summary>
/// Insere apenas as 6 fichas genéricas de exemplo (idempotente por nome).
/// </summary>
public static class SampleNpcSheetSeeder
{
    public static async Task ApplyAsync(AppDbContext db, CancellationToken ct = default)
    {
        var campaignIds = await db.Campaigns.AsNoTracking()
            .Select(c => c.Id)
            .ToListAsync(ct);

        foreach (var campaignId in campaignIds)
        {
            await ApplyForCampaignAsync(db, campaignId, ct);
        }
    }

    public static async Task ApplyForCampaignAsync(
        AppDbContext db,
        Guid campaignId,
        CancellationToken ct = default)
    {
        var names = SampleNpcSheetContent.Names.ToArray();
        var existing = await db.Sheets.AsNoTracking()
            .Where(s => s.CampaignId == campaignId && names.Contains(s.Name))
            .Select(s => s.Name)
            .ToListAsync(ct);

        var existingSet = existing.ToHashSet(StringComparer.Ordinal);
        var toAdd = SampleNpcSheetContent.All
            .Where(def => !existingSet.Contains(def.Name))
            .Select(def => CreateSheet(campaignId, def))
            .ToList();

        if (toAdd.Count == 0)
        {
            return;
        }

        db.Sheets.AddRange(toAdd);
        await db.SaveChangesAsync(ct);
    }

    private static Sheet CreateSheet(Guid campaignId, SampleNpcSheetContent.SampleSheet def)
    {
        var sheetId = Guid.NewGuid();
        var dex = AbilityScores.Clamp(def.Dexterity);

        var sheet = new Sheet
        {
            Id = sheetId,
            CampaignId = campaignId,
            Name = def.Name,
            Type = def.Type,
            Class = CharacterClass.None,
            MaxHp = def.MaxHp,
            CurrentHp = def.MaxHp,
            BaseAc = def.BaseAc,
            Strength = AbilityScores.Clamp(def.Strength),
            Dexterity = dex,
            Constitution = AbilityScores.Clamp(def.Constitution),
            Intelligence = AbilityScores.Clamp(def.Intelligence),
            Wisdom = AbilityScores.Clamp(def.Wisdom),
            Charisma = AbilityScores.Clamp(def.Charisma),
            DexModifier = AbilityScores.Modifier(dex),
            InitiativeBonus = def.InitiativeBonus,
            ProficiencyBonus = SheetRules.DefaultProficiencyBonus,
            ImageFocusX = 50,
            ImageFocusY = 50,
            ImageScale = SheetRules.ImageScaleDefault,
        };

        sheet.Features.Add(new SheetFeature
        {
            Id = Guid.NewGuid(),
            SheetId = sheetId,
            Kind = SheetFeatureKind.Note,
            Title = "Exemplo",
            Text = def.Note,
            SortOrder = 0,
        });

        sheet.Attacks.Add(new SheetAttack
        {
            Id = Guid.NewGuid(),
            SheetId = sheetId,
            Description = def.Attack.Description,
            DamageDice = def.Attack.DamageDice,
            AbilityBase = def.Attack.AbilityBase,
            StrikeType = def.Attack.StrikeType,
            SortOrder = 0,
        });

        if (SampleSeedArt.TryLoad(def.ArtFileName, out var bytes, out var contentType))
        {
            sheet.ImageUrl = null;
            sheet.Image = new SheetImage
            {
                SheetId = sheetId,
                Content = bytes,
                ContentType = contentType,
            };
        }

        return sheet;
    }
}
