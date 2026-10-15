using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Data;

/// <summary>
/// Unifica fichas legadas "Foco da Canção — …" numa única "Foco da Canção".
/// Idempotente: seguro chamar em toda subida da API.
/// </summary>
public static class SongFocusSheetUnifier
{
    public static async Task ApplyAsync(AppDbContext db, CancellationToken ct = default)
    {
        var campaignIds = await db.Campaigns.AsNoTracking().Select(c => c.Id).ToListAsync(ct);
        foreach (var campaignId in campaignIds)
        {
            await ApplyForCampaignAsync(db, campaignId, ct);
        }
    }

    public static async Task ApplyForCampaignAsync(AppDbContext db, Guid campaignId, CancellationToken ct = default)
    {
        var legacyNames = SongFocusSheetContent.LegacyNames.ToArray();
        var relevant = await db.Sheets.AsNoTracking()
            .Where(s =>
                s.CampaignId == campaignId &&
                (s.Name == SongFocusSheetContent.SheetName || legacyNames.Contains(s.Name)))
            .Select(s => new { s.Id, s.Name, s.CurrentHp })
            .ToListAsync(ct);

        var hasHydra = await db.Sheets.AnyAsync(
            s => s.CampaignId == campaignId && s.Name == SongFocusSheetContent.CompanionSheetName,
            ct);

        if (relevant.Count == 0)
        {
            if (!hasHydra)
            {
                return;
            }

            var created = CreateCanonicalSheet(campaignId);
            AddCanonicalFeatures(created);
            db.Sheets.Add(created);
            await db.SaveChangesAsync(ct);
            return;
        }

        var canonicalInfo = relevant.FirstOrDefault(s => s.Name == SongFocusSheetContent.SheetName)
            ?? relevant[0];
        var removeIds = relevant.Where(s => s.Id != canonicalInfo.Id).Select(s => s.Id).ToList();

        if (removeIds.Count > 0)
        {
            await db.Combatants
                .Where(c => removeIds.Contains(c.SheetId))
                .ExecuteUpdateAsync(setters => setters.SetProperty(c => c.SheetId, canonicalInfo.Id), ct);

            await DeleteSheetsByIdsAsync(db, removeIds, ct);
        }

        var currentHp = Math.Clamp(
            canonicalInfo.CurrentHp <= 0 ? SongFocusSheetContent.MaxHp : canonicalInfo.CurrentHp,
            BattleRules.MinHp,
            SongFocusSheetContent.MaxHp);

        await db.Sheets
            .Where(s => s.Id == canonicalInfo.Id)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(s => s.Name, SongFocusSheetContent.SheetName)
                    .SetProperty(s => s.Type, SheetType.Creature)
                    .SetProperty(s => s.MaxHp, SongFocusSheetContent.MaxHp)
                    .SetProperty(s => s.BaseAc, SongFocusSheetContent.BaseAc)
                    .SetProperty(s => s.CurrentHp, currentHp),
                ct);

        await db.SheetFeatures
            .Where(f => f.SheetId == canonicalInfo.Id)
            .ExecuteDeleteAsync(ct);

        var features = SongFocusSheetContent.Features
            .Select((line, index) => new SheetFeature
            {
                Id = Guid.NewGuid(),
                SheetId = canonicalInfo.Id,
                Kind = line.Kind,
                Title = line.Title,
                Text = line.Text,
                SortOrder = index,
            })
            .ToList();

        db.SheetFeatures.AddRange(features);
        await db.SaveChangesAsync(ct);
    }

    private static async Task DeleteSheetsByIdsAsync(AppDbContext db, List<Guid> ids, CancellationToken ct)
    {
        await db.SheetFeatures.Where(f => ids.Contains(f.SheetId)).ExecuteDeleteAsync(ct);
        await db.SheetAttacks.Where(a => ids.Contains(a.SheetId)).ExecuteDeleteAsync(ct);
        await db.SheetSpells.Where(s => ids.Contains(s.SheetId)).ExecuteDeleteAsync(ct);
        await db.SheetWeapons.Where(w => ids.Contains(w.SheetId)).ExecuteDeleteAsync(ct);
        await db.SheetImages.Where(i => ids.Contains(i.SheetId)).ExecuteDeleteAsync(ct);
        await db.Sheets.Where(s => ids.Contains(s.Id)).ExecuteDeleteAsync(ct);
    }

    private static Sheet CreateCanonicalSheet(Guid campaignId) => new()
    {
        Id = Guid.NewGuid(),
        CampaignId = campaignId,
        Name = SongFocusSheetContent.SheetName,
        Type = SheetType.Creature,
        Class = CharacterClass.None,
        MaxHp = SongFocusSheetContent.MaxHp,
        CurrentHp = SongFocusSheetContent.MaxHp,
        BaseAc = SongFocusSheetContent.BaseAc,
        Dexterity = AbilityScores.DefaultScore,
        Strength = AbilityScores.DefaultScore,
        Constitution = AbilityScores.DefaultScore,
        Intelligence = AbilityScores.DefaultScore,
        Wisdom = AbilityScores.DefaultScore,
        Charisma = AbilityScores.DefaultScore,
        DexModifier = AbilityScores.Modifier(AbilityScores.DefaultScore),
        ProficiencyBonus = SheetRules.DefaultProficiencyBonus,
        ImageFocusX = 50,
        ImageFocusY = 50,
        ImageScale = SheetRules.ImageScaleDefault,
    };

    private static void AddCanonicalFeatures(Sheet sheet)
    {
        for (var i = 0; i < SongFocusSheetContent.Features.Count; i++)
        {
            var (kind, title, text) = SongFocusSheetContent.Features[i];
            sheet.Features.Add(new SheetFeature
            {
                Id = Guid.NewGuid(),
                SheetId = sheet.Id,
                Kind = kind,
                Title = title,
                Text = text,
                SortOrder = i,
            });
        }
    }
}
