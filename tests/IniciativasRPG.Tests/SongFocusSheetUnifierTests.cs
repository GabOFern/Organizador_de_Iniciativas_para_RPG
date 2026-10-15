using FluentAssertions;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using IniciativasRPG.Tests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Tests;

public class SongFocusSheetUnifierTests : IAsyncDisposable
{
    private readonly TestDb _testDb = TestDb.Create();
    private readonly Guid _campaignId;

    public SongFocusSheetUnifierTests()
    {
        _campaignId = _testDb.SeedCampaign();
    }

    public ValueTask DisposeAsync() => _testDb.DisposeAsync();

    private Sheet AddLegacy(string name)
    {
        var sheet = new Sheet
        {
            Id = Guid.NewGuid(),
            CampaignId = _campaignId,
            Name = name,
            Type = SheetType.Creature,
            MaxHp = 30,
            CurrentHp = 30,
            BaseAc = 15,
            DexModifier = 0,
            ProficiencyBonus = SheetRules.DefaultProficiencyBonus,
            Features =
            [
                new SheetFeature
                {
                    Id = Guid.NewGuid(),
                    Kind = SheetFeatureKind.Trait,
                    Title = "Legado",
                    Text = $"Conteúdo antigo de {name}",
                    SortOrder = 0,
                }
            ],
        };
        sheet.Features.First().SheetId = sheet.Id;
        _testDb.Context.Sheets.Add(sheet);
        return sheet;
    }

    [Fact]
    public async Task Apply_ThreeLegacySheets_MergesIntoOneCanonical()
    {
        AddLegacy("Foco da Canção — Pavor");
        AddLegacy("Foco da Canção — Recomposição");
        AddLegacy("Foco da Canção — Ruína");
        await _testDb.Context.SaveChangesAsync();
        _testDb.Context.ChangeTracker.Clear();

        await SongFocusSheetUnifier.ApplyAsync(_testDb.Context);
        _testDb.Context.ChangeTracker.Clear();

        var sheets = await _testDb.Context.Sheets
            .Include(s => s.Features)
            .Where(s => s.CampaignId == _campaignId)
            .ToListAsync();

        sheets.Should().HaveCount(1);
        var focus = sheets[0];
        focus.Name.Should().Be(SongFocusSheetContent.SheetName);
        focus.MaxHp.Should().Be(30);
        focus.BaseAc.Should().Be(15);
        focus.Features.Select(f => f.Title).Should().Contain(["Ruína", "Recomposição", "Pavor", "Silenciar"]);
        sheets.Select(s => s.Name).Should().NotContain(SongFocusSheetContent.LegacyNames);
    }

    [Fact]
    public async Task Apply_CombatantsOnLegacy_ReassignToCanonical()
    {
        var pavor = AddLegacy("Foco da Canção — Pavor");
        var ruina = AddLegacy("Foco da Canção — Ruína");
        await _testDb.Context.SaveChangesAsync();

        var battle = new Battle
        {
            Id = Guid.NewGuid(),
            CampaignId = _campaignId,
            Status = BattleStatus.Finished,
            CreatedAtUtc = DateTime.UtcNow,
        };
        _testDb.Context.Battles.Add(battle);
        var combatantId = Guid.NewGuid();
        _testDb.Context.Combatants.Add(new Combatant
        {
            Id = combatantId,
            BattleId = battle.Id,
            SheetId = ruina.Id,
            Initiative = 0,
            CurrentHp = 30,
            MaxHp = 30,
            BaseAc = 15,
            CurrentAc = 15,
        });
        await _testDb.Context.SaveChangesAsync();
        _testDb.Context.ChangeTracker.Clear();

        await SongFocusSheetUnifier.ApplyAsync(_testDb.Context);
        _testDb.Context.ChangeTracker.Clear();

        var canonical = await _testDb.Context.Sheets.SingleAsync(s => s.CampaignId == _campaignId);
        var combatant = await _testDb.Context.Combatants.SingleAsync(c => c.Id == combatantId);
        combatant.SheetId.Should().Be(canonical.Id);
        canonical.Name.Should().Be(SongFocusSheetContent.SheetName);
        _testDb.Context.Sheets
            .Any(s => SongFocusSheetContent.LegacyNames.Contains(s.Name))
            .Should().BeFalse();
        // Uma das fichas legadas vira a canônica; a outra some.
        new[] { pavor.Id, ruina.Id }.Count(id => id == canonical.Id).Should().Be(1);
    }

    [Fact]
    public async Task Apply_Twice_IsIdempotent()
    {
        AddLegacy("Foco da Canção — Pavor");
        AddLegacy("Foco da Canção — Recomposição");
        AddLegacy("Foco da Canção — Ruína");
        await _testDb.Context.SaveChangesAsync();
        _testDb.Context.ChangeTracker.Clear();

        await SongFocusSheetUnifier.ApplyAsync(_testDb.Context);
        _testDb.Context.ChangeTracker.Clear();
        await SongFocusSheetUnifier.ApplyAsync(_testDb.Context);
        _testDb.Context.ChangeTracker.Clear();

        var sheets = await _testDb.Context.Sheets
            .Include(s => s.Features)
            .Where(s => s.CampaignId == _campaignId)
            .ToListAsync();

        sheets.Should().HaveCount(1);
        sheets[0].Features.Should().HaveCount(SongFocusSheetContent.Features.Count);
        sheets[0].Features.Count(f => f.Title == "Ruína").Should().Be(1);
    }

    [Fact]
    public async Task Apply_OnlyHydraWithoutFocus_CreatesCanonical()
    {
        _testDb.Context.Sheets.Add(new Sheet
        {
            Id = Guid.NewGuid(),
            CampaignId = _campaignId,
            Name = SongFocusSheetContent.CompanionSheetName,
            Type = SheetType.Creature,
            MaxHp = 360,
            CurrentHp = 360,
            BaseAc = 17,
            DexModifier = 2,
        });
        await _testDb.Context.SaveChangesAsync();
        _testDb.Context.ChangeTracker.Clear();

        await SongFocusSheetUnifier.ApplyAsync(_testDb.Context);
        _testDb.Context.ChangeTracker.Clear();

        var focus = await _testDb.Context.Sheets
            .Include(s => s.Features)
            .SingleAsync(s => s.Name == SongFocusSheetContent.SheetName);
        focus.MaxHp.Should().Be(30);
        focus.Features.Should().HaveCount(SongFocusSheetContent.Features.Count);
    }
}
