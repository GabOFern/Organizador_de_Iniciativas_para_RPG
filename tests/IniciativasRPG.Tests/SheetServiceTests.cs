using FluentAssertions;
using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Domain;
using IniciativasRPG.Api.Services;
using IniciativasRPG.Tests.Helpers;

namespace IniciativasRPG.Tests;

public class SheetServiceTests : IAsyncDisposable
{
    private readonly TestDb _testDb = TestDb.Create();
    private readonly SheetService _sut;
    private readonly Guid _campaignId;

    public SheetServiceTests()
    {
        _campaignId = _testDb.SeedCampaign();
        _sut = new SheetService(_testDb.Context, new DiceService());
    }

    public ValueTask DisposeAsync() => _testDb.DisposeAsync();

    private static CreateSheetRequest ValidCreateRequest(string name = "Esqueleto") => new(
        Name: name,
        ImageUrl: null,
        Type: SheetType.Creature,
        Class: CharacterClass.None,
        MaxHp: 13,
        BaseAc: 13,
        Strength: 10,
        Dexterity: 14,
        Constitution: 15,
        Intelligence: 6,
        Wisdom: 8,
        Charisma: 5,
        Features: [new(SheetFeatureKind.Trait, "Fortitude", "Testa Constituição ao cair a 0 PV.")],
        Attacks: [new("Espada curta", "1d6+2", AbilityName.Dexterity, StrikeType.Melee)],
        Spells: null,
        Weapons: [new("Arco curto", "1d6", "24/96 m", StrikeType.Ranged)],
        ImageFocusX: 50,
        ImageFocusY: 50,
        ImageScale: SheetRules.ImageScaleDefault);

    // ───────────── Create ─────────────

    [Fact]
    public async Task Create_ValidRequest_ReturnsSheetWithAllFields()
    {
        var result = await _sut.CreateAsync(_campaignId, ValidCreateRequest());

        result.Name.Should().Be("Esqueleto");
        result.MaxHp.Should().Be(13);
        result.CurrentHp.Should().Be(13, "CurrentHp inicia igual a MaxHp");
        result.BaseAc.Should().Be(13);
        result.DexModifier.Should().Be(2, "Dex 14 → mod +2");
        result.ImageFocusX.Should().Be(50);
        result.ImageFocusY.Should().Be(50);
        result.ImageScale.Should().Be(1);
        result.Type.Should().Be("Creature");
        result.Class.Should().Be("None");
        result.Features.Should().HaveCount(1);
        result.Features[0].Title.Should().Be("Fortitude");
        result.Attacks.Should().HaveCount(1);
        result.Weapons.Should().HaveCount(1);
    }

    [Fact]
    public async Task Create_EmptyName_ThrowsDomainException()
    {
        var request = ValidCreateRequest(name: "  ");

        var act = () => _sut.CreateAsync(_campaignId, request);

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.NameRequired);
    }

    [Fact]
    public async Task Create_InvalidImageUrl_ThrowsDomainException()
    {
        var request = ValidCreateRequest() with { ImageUrl = "ftp://not-http.com/img.png" };

        var act = () => _sut.CreateAsync(_campaignId, request);

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.SheetImageUrlInvalid);
    }

    [Fact]
    public async Task Create_ImageUrlTooLong_ThrowsDomainException()
    {
        var longUrl = "https://example.com/" + new string('a', SheetRules.MaxImageUrlLength);
        var request = ValidCreateRequest() with { ImageUrl = longUrl };

        var act = () => _sut.CreateAsync(_campaignId, request);

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.SheetImageUrlTooLong);
    }

    [Fact]
    public async Task Create_ClampsAbilityScores()
    {
        var request = ValidCreateRequest() with { Strength = 0, Charisma = 999 };

        var result = await _sut.CreateAsync(_campaignId, request);

        result.Strength.Should().Be(AbilityScores.MinScore);
        result.Charisma.Should().Be(AbilityScores.MaxScore);
    }

    [Fact]
    public async Task Create_ClampsFocusAndScale()
    {
        var request = ValidCreateRequest() with { ImageFocusX = -10, ImageFocusY = 200, ImageScale = 99 };

        var result = await _sut.CreateAsync(_campaignId, request);

        result.ImageFocusX.Should().Be(0);
        result.ImageFocusY.Should().Be(100);
        result.ImageScale.Should().Be(SheetRules.ImageScaleMax);
    }

    [Fact]
    public async Task Create_FeatureWithEmptyTitle_ThrowsDomainException()
    {
        var request = ValidCreateRequest() with
        {
            Features = [new(SheetFeatureKind.Trait, "  ", "Texto válido.")]
        };

        var act = () => _sut.CreateAsync(_campaignId, request);

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.FeatureTitleRequired);
    }

    [Fact]
    public async Task Create_AttackWithInvalidDice_ThrowsDomainException()
    {
        var request = ValidCreateRequest() with
        {
            Attacks = [new("Golpe", "abc", AbilityName.Strength, StrikeType.Melee)]
        };

        var act = () => _sut.CreateAsync(_campaignId, request);

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.AttackDamageRequired);
    }

    [Fact]
    public async Task Create_WeaponWithoutRange_ThrowsDomainException()
    {
        var request = ValidCreateRequest() with
        {
            Weapons = [new("Arco", "1d8", "  ", StrikeType.Ranged)]
        };

        var act = () => _sut.CreateAsync(_campaignId, request);

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.WeaponRangeRequired);
    }

    // ───────────── Update ─────────────

    [Fact]
    public async Task Update_ValidRequest_PersistsAllChanges()
    {
        var created = await _sut.CreateAsync(_campaignId, ValidCreateRequest());
        _testDb.Context.ChangeTracker.Clear();

        var updateRequest = new UpdateSheetRequest(
            Name: "Esqueleto Guerreiro",
            ImageUrl: "https://example.com/skel.png",
            Type: SheetType.Creature,
            Class: CharacterClass.Fighter,
            MaxHp: 20,
            CurrentHp: 15,
            BaseAc: 15,
            Strength: 16,
            Dexterity: 12,
            Constitution: 14,
            Intelligence: 8,
            Wisdom: 10,
            Charisma: 6,
            Features: [new(SheetFeatureKind.Note, "Tipo", "Morto-vivo")],
            Attacks: [new("Espada longa", "1d8+3", AbilityName.Strength, StrikeType.Melee)],
            Spells: [new("Raio gélido", "1d8", 0, false, AbilityName.Intelligence)],
            Weapons: null,
            ImageFocusX: 30,
            ImageFocusY: 70,
            ImageScale: 0.5,
            InitiativeBonus: 1,
            ProficiencyBonus: 3);

        var updated = await _sut.UpdateAsync(_campaignId, created.Id, updateRequest);

        updated.Name.Should().Be("Esqueleto Guerreiro");
        updated.ImageUrl.Should().Be("https://example.com/skel.png");
        updated.Class.Should().Be("Fighter");
        updated.MaxHp.Should().Be(20);
        updated.CurrentHp.Should().Be(15);
        updated.BaseAc.Should().Be(15);
        updated.ImageFocusX.Should().Be(30);
        updated.ImageFocusY.Should().Be(70);
        updated.ImageScale.Should().Be(0.5);
        updated.InitiativeBonus.Should().Be(1);
        updated.ProficiencyBonus.Should().Be(3);
        updated.Features.Should().HaveCount(1);
        updated.Features[0].Title.Should().Be("Tipo");
        updated.Attacks.Should().HaveCount(1);
        updated.Attacks[0].Description.Should().Be("Espada longa");
        updated.Spells.Should().HaveCount(1);
        updated.Weapons.Should().BeEmpty();
    }

    [Fact]
    public async Task Update_NonExistentSheet_ThrowsNotFound()
    {
        var request = new UpdateSheetRequest(
            Name: "Fantasma",
            ImageUrl: null,
            Type: SheetType.Creature,
            Class: CharacterClass.None,
            MaxHp: 10,
            CurrentHp: 10,
            BaseAc: 10,
            Strength: 10, Dexterity: 10, Constitution: 10,
            Intelligence: 10, Wisdom: 10, Charisma: 10);

        var act = () => _sut.UpdateAsync(_campaignId, Guid.NewGuid(), request);

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.SheetNotFound);
    }

    [Fact]
    public async Task Update_EmptyName_ThrowsDomainException()
    {
        var created = await _sut.CreateAsync(_campaignId, ValidCreateRequest());
        _testDb.Context.ChangeTracker.Clear();

        var request = new UpdateSheetRequest(
            Name: "",
            ImageUrl: null,
            Type: SheetType.Creature,
            Class: CharacterClass.None,
            MaxHp: 13, CurrentHp: 13, BaseAc: 13,
            Strength: 10, Dexterity: 14, Constitution: 15,
            Intelligence: 6, Wisdom: 8, Charisma: 5);

        var act = () => _sut.UpdateAsync(_campaignId, created.Id, request);

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.NameRequired);
    }

    [Fact]
    public async Task Update_ClampsCurrentHpToMaxHp()
    {
        var created = await _sut.CreateAsync(_campaignId, ValidCreateRequest());
        _testDb.Context.ChangeTracker.Clear();

        var request = new UpdateSheetRequest(
            Name: "Esqueleto",
            ImageUrl: null,
            Type: SheetType.Creature,
            Class: CharacterClass.None,
            MaxHp: 13, CurrentHp: 999, BaseAc: 13,
            Strength: 10, Dexterity: 14, Constitution: 15,
            Intelligence: 6, Wisdom: 8, Charisma: 5);

        var updated = await _sut.UpdateAsync(_campaignId, created.Id, request);

        updated.CurrentHp.Should().Be(13, "CurrentHp não pode ultrapassar MaxHp");
    }

    // ───────────── List ─────────────

    [Fact]
    public async Task List_ReturnsCreatedSheets()
    {
        await _sut.CreateAsync(_campaignId, ValidCreateRequest("Alfa"));
        await _sut.CreateAsync(_campaignId, ValidCreateRequest("Beta"));

        var list = await _sut.ListAsync(_campaignId);

        list.Should().HaveCount(2);
        list.Select(s => s.Name).Should().BeEquivalentTo(["Alfa", "Beta"]);
    }

    [Fact]
    public async Task List_EmptyCampaign_ReturnsEmptyList()
    {
        var list = await _sut.ListAsync(_campaignId);

        list.Should().BeEmpty();
    }

    // ───────────── Delete ─────────────

    [Fact]
    public async Task Delete_ExistingSheet_RemovesFromList()
    {
        var created = await _sut.CreateAsync(_campaignId, ValidCreateRequest());
        _testDb.Context.ChangeTracker.Clear();

        await _sut.DeleteAsync(_campaignId, created.Id);

        var list = await _sut.ListAsync(_campaignId);
        list.Should().BeEmpty();
        _testDb.Context.Sheets.Any(s => s.Id == created.Id).Should().BeFalse();
    }

    [Fact]
    public async Task Delete_NonExistentSheet_ThrowsNotFound()
    {
        var act = () => _sut.DeleteAsync(_campaignId, Guid.NewGuid());

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.SheetNotFound);
    }

    [Fact]
    public async Task Delete_SheetInActiveBattle_ThrowsDomainException()
    {
        var created = await _sut.CreateAsync(_campaignId, ValidCreateRequest());
        var battle = new Battle
        {
            Id = Guid.NewGuid(),
            CampaignId = _campaignId,
            Status = BattleStatus.Active,
            CreatedAtUtc = DateTime.UtcNow,
        };
        _testDb.Context.Battles.Add(battle);
        _testDb.Context.Combatants.Add(new Combatant
        {
            Id = Guid.NewGuid(),
            BattleId = battle.Id,
            SheetId = created.Id,
            Initiative = 10,
            CurrentHp = created.CurrentHp,
            MaxHp = created.MaxHp,
            BaseAc = created.BaseAc,
            CurrentAc = created.BaseAc,
        });
        await _testDb.Context.SaveChangesAsync();
        _testDb.Context.ChangeTracker.Clear();

        var act = () => _sut.DeleteAsync(_campaignId, created.Id);

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.SheetInActiveBattle);
    }

    [Fact]
    public async Task Delete_SheetWithFinishedBattleHistory_RemovesSheetAndCombatants()
    {
        var created = await _sut.CreateAsync(_campaignId, ValidCreateRequest());
        var battle = new Battle
        {
            Id = Guid.NewGuid(),
            CampaignId = _campaignId,
            Status = BattleStatus.Finished,
            CreatedAtUtc = DateTime.UtcNow,
        };
        var combatantId = Guid.NewGuid();
        _testDb.Context.Battles.Add(battle);
        _testDb.Context.Combatants.Add(new Combatant
        {
            Id = combatantId,
            BattleId = battle.Id,
            SheetId = created.Id,
            Initiative = 10,
            CurrentHp = created.CurrentHp,
            MaxHp = created.MaxHp,
            BaseAc = created.BaseAc,
            CurrentAc = created.BaseAc,
        });
        await _testDb.Context.SaveChangesAsync();
        _testDb.Context.ChangeTracker.Clear();

        await _sut.DeleteAsync(_campaignId, created.Id);

        _testDb.Context.Sheets.Any(s => s.Id == created.Id).Should().BeFalse();
        _testDb.Context.Combatants.Any(c => c.Id == combatantId).Should().BeFalse();
    }

    // ───────────── Spell Validation ─────────────

    [Fact]
    public async Task Create_SpellWithInvalidSlot_ThrowsDomainException()
    {
        var request = ValidCreateRequest() with
        {
            Spells = [new("Bola de fogo", "8d6", 10, false, AbilityName.Intelligence)]
        };

        var act = () => _sut.CreateAsync(_campaignId, request);

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.InvalidSpellSlot);
    }

    [Fact]
    public async Task Create_SpellWithInvalidDice_ThrowsDomainException()
    {
        var request = ValidCreateRequest() with
        {
            Spells = [new("Magia ruim", "xyz", 0, false, AbilityName.Wisdom)]
        };

        var act = () => _sut.CreateAsync(_campaignId, request);

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.InvalidDiceNotation);
    }
}
