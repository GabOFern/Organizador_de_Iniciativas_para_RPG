using FluentAssertions;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using IniciativasRPG.Tests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Tests;

public class SampleNpcSheetSeederTests : IAsyncDisposable
{
    private readonly TestDb _testDb = TestDb.Create();
    private readonly Guid _campaignId;

    public SampleNpcSheetSeederTests()
    {
        _campaignId = _testDb.SeedCampaign();
    }

    public ValueTask DisposeAsync() => _testDb.DisposeAsync();

    [Fact]
    public async Task Apply_EmptyCampaign_CreatesOnlySixSampleSheets()
    {
        await SampleNpcSheetSeeder.ApplyForCampaignAsync(_testDb.Context, _campaignId);

        var sheets = await _testDb.Context.Sheets
            .Include(s => s.Attacks)
            .Include(s => s.Features)
            .Where(s => s.CampaignId == _campaignId)
            .ToListAsync();

        sheets.Should().HaveCount(6);
        sheets.Select(s => s.Name).Should().BeEquivalentTo(SampleNpcSheetContent.Names);
        sheets.Should().NotContain(s => s.Name == "Orc" || s.Name == "Zumbi");

        var guard = sheets.Single(s => s.Name == "Guarda da Cidade");
        guard.Type.Should().Be(SheetType.Npc);
        guard.MaxHp.Should().Be(11);
        guard.Attacks.Should().ContainSingle(a => a.Description == "Lança");
    }

    [Fact]
    public async Task Apply_Twice_DoesNotDuplicate()
    {
        await SampleNpcSheetSeeder.ApplyForCampaignAsync(_testDb.Context, _campaignId);
        await SampleNpcSheetSeeder.ApplyForCampaignAsync(_testDb.Context, _campaignId);

        var count = await _testDb.Context.Sheets.CountAsync(s => s.CampaignId == _campaignId);
        count.Should().Be(6);
    }

    [Fact]
    public async Task Apply_ExistingName_SkipsThatSheetOnly()
    {
        _testDb.Context.Sheets.Add(new Sheet
        {
            Id = Guid.NewGuid(),
            CampaignId = _campaignId,
            Name = "Goblin",
            Type = SheetType.Creature,
            MaxHp = 99,
            CurrentHp = 99,
            BaseAc = 10,
            DexModifier = 0,
            ProficiencyBonus = SheetRules.DefaultProficiencyBonus,
        });
        await _testDb.Context.SaveChangesAsync();
        _testDb.Context.ChangeTracker.Clear();

        await SampleNpcSheetSeeder.ApplyForCampaignAsync(_testDb.Context, _campaignId);

        var goblin = await _testDb.Context.Sheets.SingleAsync(
            s => s.CampaignId == _campaignId && s.Name == "Goblin");
        goblin.MaxHp.Should().Be(99);

        var count = await _testDb.Context.Sheets.CountAsync(s => s.CampaignId == _campaignId);
        count.Should().Be(6);
    }

    [Fact]
    public void Catalog_ContainsOnlyAllowedNames()
    {
        SampleNpcSheetContent.Names.Should().BeEquivalentTo(
        [
            "Guarda da Cidade",
            "Guarda Veterano",
            "Bandido",
            "Goblin",
            "Esqueleto",
            "Lobo",
        ]);
    }
}
