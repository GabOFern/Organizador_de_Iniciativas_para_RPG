using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Domain;
using IniciativasRPG.Api.Services;
using IniciativasRPG.Tests.Helpers;

namespace IniciativasRPG.Tests;

public class LineupServiceTests : IAsyncDisposable
{
    private readonly TestDb _testDb = TestDb.Create();
    private readonly LineupService _sut;
    private readonly Guid _campaignId;

    public LineupServiceTests()
    {
        _campaignId = _testDb.SeedCampaign();
        _sut = new LineupService(_testDb.Context);
    }

    public ValueTask DisposeAsync() => _testDb.DisposeAsync();

    [Fact]
    public async Task Create_ValidRequest_ReturnsLineupWithMembers()
    {
        var diana = SeedSheet("Diana", SheetType.Player);
        var howl = SeedSheet("Howl", SheetType.Player);

        var result = await _sut.CreateAsync(_campaignId, Scene("  Jogadores  ", diana, howl));

        result.Name.Should().Be("Jogadores");
        result.Members.Select(m => m.SheetName).Should().Equal("Diana", "Howl");
        result.Members.Select(m => m.SortOrder).Should().Equal(0, 1);
    }

    [Fact]
    public async Task Create_EmptyName_ThrowsDomainException()
    {
        var diana = SeedSheet("Diana", SheetType.Player);

        var act = () => _sut.CreateAsync(_campaignId, Scene("  ", diana));

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.LineupNameRequired);
    }

    [Fact]
    public async Task Create_NoMembers_ThrowsDomainException()
    {
        var act = () => _sut.CreateAsync(_campaignId, Scene("Cemitério"));

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.LineupNeedsMembers);
    }

    [Fact]
    public async Task Create_DuplicateSheet_ThrowsDomainException()
    {
        var diana = SeedSheet("Diana", SheetType.Player);

        var act = () => _sut.CreateAsync(_campaignId, Scene("Jogadores", diana, diana));

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.LineupDuplicateSheet);
    }

    [Fact]
    public async Task Create_SheetFromAnotherCampaign_ThrowsDomainException()
    {
        var other = _testDb.SeedCampaign("Outra", "other-token-123456");
        var foreign = SeedSheet("Estranho", SheetType.Npc, other);

        var act = () => _sut.CreateAsync(_campaignId, Scene("Visita", foreign));

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.LineupSheetNotInCampaign);
    }

    [Fact]
    public async Task List_ReturnsOnlyThisCampaign()
    {
        var diana = SeedSheet("Diana", SheetType.Player);
        await _sut.CreateAsync(_campaignId, Scene("Jogadores", diana));

        var other = _testDb.SeedCampaign("Outra", "other-token-654321");
        var skeleton = SeedSheet("Esqueleto", SheetType.Creature, other);
        await _sut.CreateAsync(other, Scene("Cemitério", skeleton));

        var list = await _sut.ListAsync(_campaignId);

        list.Should().ContainSingle().Which.Name.Should().Be("Jogadores");
    }

    [Fact]
    public async Task Update_ReplacesNameAndMembers()
    {
        var diana = SeedSheet("Diana", SheetType.Player);
        var skeleton = SeedSheet("Esqueleto", SheetType.Creature);
        var created = await _sut.CreateAsync(_campaignId, Scene("Jogadores", diana));

        var updated = await _sut.UpdateAsync(
            _campaignId,
            created.Id,
            Scene("Cemitério", skeleton));

        updated.Name.Should().Be("Cemitério");
        updated.Members.Should().ContainSingle().Which.SheetId.Should().Be(skeleton);
    }

    [Fact]
    public async Task Delete_RemovesLineup_KeepsSheets()
    {
        var diana = SeedSheet("Diana", SheetType.Player);
        var created = await _sut.CreateAsync(_campaignId, Scene("Jogadores", diana));

        await _sut.DeleteAsync(_campaignId, created.Id);

        (await _testDb.Context.Lineups.AnyAsync()).Should().BeFalse();
        (await _testDb.Context.Sheets.AnyAsync(s => s.Id == diana)).Should().BeTrue();
    }

    [Fact]
    public async Task Create_Quantity_StoresCopies()
    {
        var bell = SeedSheet("Sino", SheetType.Creature);

        var result = await _sut.CreateAsync(
            _campaignId,
            new SaveLineupRequest("Cemitério", [new SaveLineupMemberRequest(bell, 3)]));

        result.Members.Should().ContainSingle();
        result.Members[0].Quantity.Should().Be(3);
        result.Members[0].SheetName.Should().Be("Sino");
    }

    [Fact]
    public async Task Create_PlayerQuantityAboveOne_ThrowsDomainException()
    {
        var diana = SeedSheet("Diana", SheetType.Player);

        var act = () => _sut.CreateAsync(
            _campaignId,
            new SaveLineupRequest("Jogadores", [new SaveLineupMemberRequest(diana, LineupRules.MaxPlayerQuantity + 1)]));

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.LineupQuantityInvalid);
    }

    private static SaveLineupRequest Scene(string name, params Guid[] sheetIds) =>
        new(name, sheetIds.Select(id => new SaveLineupMemberRequest(id, LineupRules.MinQuantity)).ToList());

    private Guid SeedSheet(string name, SheetType type, Guid? campaignId = null)
    {
        var sheet = new Sheet
        {
            Id = Guid.NewGuid(),
            CampaignId = campaignId ?? _campaignId,
            Name = name,
            Type = type,
            Class = CharacterClass.None,
            MaxHp = 10,
            CurrentHp = 10,
            BaseAc = 12,
            Dexterity = 14,
            DexModifier = 2,
            InitiativeBonus = 2,
        };
        _testDb.Context.Sheets.Add(sheet);
        _testDb.Context.SaveChanges();
        return sheet.Id;
    }
}
