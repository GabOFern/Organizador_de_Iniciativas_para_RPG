using FluentAssertions;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using IniciativasRPG.Tests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Tests;

public class SampleSheetImageSeederTests : IAsyncDisposable
{
    private readonly TestDb _testDb = TestDb.Create();
    private readonly Guid _campaignId;

    public SampleSheetImageSeederTests()
    {
        _campaignId = _testDb.SeedCampaign();
    }

    public ValueTask DisposeAsync() => _testDb.DisposeAsync();

    private Sheet AddSheet(string name, string? imageUrl = null)
    {
        var sheet = new Sheet
        {
            Id = Guid.NewGuid(),
            CampaignId = _campaignId,
            Name = name,
            Type = SheetType.Creature,
            MaxHp = 10,
            CurrentHp = 10,
            BaseAc = 10,
            DexModifier = 0,
            ProficiencyBonus = SheetRules.DefaultProficiencyBonus,
            ImageUrl = imageUrl,
        };
        _testDb.Context.Sheets.Add(sheet);
        return sheet;
    }

    [Fact]
    public async Task Apply_CampaignCreature_GetsMatchingLocalArt()
    {
        SampleSeedArt.TryLoad("banshee.jpg", out _, out _).Should().BeTrue();
        AddSheet("Banshee", SampleSheetImageUrls.LegacyCatalogUrls[2]);
        await _testDb.Context.SaveChangesAsync();

        await SampleSheetImageSeeder.ApplyAsync(_testDb.Context);

        var banshee = await _testDb.Context.Sheets
            .Include(s => s.Image)
            .SingleAsync(s => s.Name == "Banshee");
        banshee.Image.Should().NotBeNull();
        banshee.Image!.Content.Should().NotBeEmpty();
        banshee.ImageUrl.Should().BeNull();
    }

    [Fact]
    public async Task Apply_SkipLysanderSammyFalsaHidra()
    {
        AddSheet("Lysander, o Bibliotecário Noturno");
        AddSheet("Sammy, a Guarda Silenciosa");
        AddSheet("Falsa Hidra");
        AddSheet("Foco da Canção");
        await _testDb.Context.SaveChangesAsync();

        await SampleSheetImageSeeder.ApplyAsync(_testDb.Context);

        var sheets = await _testDb.Context.Sheets.Include(s => s.Image).ToListAsync();
        foreach (var sheet in sheets)
        {
            sheet.Image.Should().BeNull();
            sheet.ImageUrl.Should().BeNullOrEmpty();
        }
    }

    [Fact]
    public async Task Apply_CustomUrlOnCampaignCreature_IsPreserved()
    {
        AddSheet("Banshee", "https://example.com/minha-banshee.png");
        await _testDb.Context.SaveChangesAsync();

        await SampleSheetImageSeeder.ApplyAsync(_testDb.Context);

        var banshee = await _testDb.Context.Sheets
            .Include(s => s.Image)
            .SingleAsync(s => s.Name == "Banshee");
        banshee.ImageUrl.Should().Be("https://example.com/minha-banshee.png");
        banshee.Image.Should().BeNull();
    }

    [Fact]
    public async Task Apply_SampleWithoutImage_AttachesLocalArt()
    {
        SampleSeedArt.TryLoad("goblin.jpg", out _, out _).Should().BeTrue();
        AddSheet("Goblin");
        await _testDb.Context.SaveChangesAsync();

        await SampleSheetImageSeeder.ApplyAsync(_testDb.Context);

        var goblin = await _testDb.Context.Sheets
            .Include(s => s.Image)
            .SingleAsync(s => s.Name == "Goblin");
        goblin.Image.Should().NotBeNull();
        goblin.Image!.Content.Should().NotBeEmpty();
        goblin.ImageUrl.Should().BeNull();
    }
}
