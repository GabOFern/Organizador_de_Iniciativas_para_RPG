using FluentAssertions;
using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Domain;
using IniciativasRPG.Api.Services;
using IniciativasRPG.Tests.Helpers;

namespace IniciativasRPG.Tests;

public class BattleServiceTests : IAsyncDisposable
{
    private const string PublicToken = "public-snapshot-token";

    private readonly TestDb _testDb = TestDb.Create();
    private readonly BattleService _battle;
    private readonly Guid _campaignId;

    public BattleServiceTests()
    {
        _campaignId = _testDb.SeedCampaign(publicToken: PublicToken);
        _battle = new BattleService(_testDb.Context, new FakeDiceService(), new FakeBattleNotifier());
    }

    public ValueTask DisposeAsync() => _testDb.DisposeAsync();

    [Fact]
    public async Task BuildSnapshot_ForPublic_OmitsLastTickEvents()
    {
        var targetId = SeedSheet("Alvo", SheetType.Player, currentHp: 30, maxHp: 30);
        var otherId = SeedSheet("Outro", SheetType.Player, currentHp: 10, maxHp: 10);
        var invoked = await _battle.InvokePlayerAsync(_campaignId, new InvokePlayerRequest(targetId, 20));
        await _battle.InvokePlayerAsync(_campaignId, new InvokePlayerRequest(otherId, 5));

        var modifierTypeId = SeedFixedDamage("Veneno", 4);
        var targetCombatantId = invoked.Combatants.Single(c => c.SheetId == targetId).Id;
        await _battle.ApplyModifierAsync(
            _campaignId,
            new ApplyModifierRequest(targetCombatantId, modifierTypeId, 2));

        var master = await _battle.StartAsync(_campaignId);
        var publicSnapshot = await _battle.GetByPublicTokenAsync(PublicToken, forPublic: true);

        master.LastTickEvents.Should().NotBeNullOrEmpty();
        master.LastTickEvents.Should().ContainSingle(e =>
            e.CombatantId == targetCombatantId && e.Kind == "Damage" && e.Amount == 4);
        publicSnapshot.LastTickEvents.Should().BeNull();
        publicSnapshot.Combatants.Should().Contain(c => c.SheetId == targetId && c.Modifiers.Count == 1);
    }

    [Fact]
    public async Task BuildSnapshot_ForPublic_HideHpFromPublic_MasksHp()
    {
        var creatureId = SeedSheet(
            "Esqueleto",
            SheetType.Creature,
            currentHp: 18,
            maxHp: 24,
            imageUrl: "https://cdn.example/esqueleto.png",
            imageFocusX: 30,
            imageFocusY: 70,
            imageScale: 1.5);
        var playerId = SeedSheet(
            "Diana",
            SheetType.Player,
            currentHp: 9,
            maxHp: 12,
            imageUrl: "https://cdn.example/diana.png",
            imageFocusX: 25,
            imageFocusY: 75,
            imageScale: 1.25);
        _testDb.Context.SheetImages.Add(new SheetImage
        {
            SheetId = playerId,
            Content = [1, 2, 3],
            ContentType = SheetRules.PngContentType,
        });
        _testDb.Context.SaveChanges();

        await _battle.InvokeCreatureAsync(
            _campaignId,
            new InvokeCreatureRequest(creatureId, 8, false, null, HideHpFromPublic: true));
        await _battle.InvokePlayerAsync(_campaignId, new InvokePlayerRequest(playerId, 15));

        var master = await _battle.GetByPublicTokenAsync(PublicToken, forPublic: false);
        var publicSnapshot = await _battle.GetByPublicTokenAsync(PublicToken, forPublic: true);

        var masterCreature = master.Combatants.Single(c => c.SheetId == creatureId);
        masterCreature.CurrentHp.Should().Be(18);
        masterCreature.MaxHp.Should().Be(24);
        masterCreature.HideHpFromPublic.Should().BeTrue();

        var publicCreature = publicSnapshot.Combatants.Single(c => c.SheetId == creatureId);
        publicCreature.Name.Should().Be("Esqueleto");
        publicCreature.SheetType.Should().Be(SheetType.Creature.ToString());
        publicCreature.ImageUrl.Should().Be("https://cdn.example/esqueleto.png");
        publicCreature.ImageFocusX.Should().Be(30);
        publicCreature.ImageFocusY.Should().Be(70);
        publicCreature.ImageScale.Should().Be(1.5);
        publicCreature.CurrentHp.Should().Be(0);
        publicCreature.MaxHp.Should().Be(0);
        publicCreature.HideHpFromPublic.Should().BeTrue();

        var publicPlayer = publicSnapshot.Combatants.Single(c => c.SheetId == playerId);
        publicPlayer.Name.Should().Be("Diana");
        publicPlayer.SheetType.Should().Be(SheetType.Player.ToString());
        publicPlayer.ImageUrl.Should().Be(SheetImagePaths.Public(PublicToken, playerId));
        publicPlayer.ImageFocusX.Should().Be(25);
        publicPlayer.ImageFocusY.Should().Be(75);
        publicPlayer.ImageScale.Should().Be(1.25);
        publicPlayer.CurrentHp.Should().Be(9);
        publicPlayer.MaxHp.Should().Be(12);
        publicPlayer.HideHpFromPublic.Should().BeFalse();
        publicSnapshot.LastTickEvents.Should().BeNull();
    }

    private Guid SeedFixedDamage(string name, int amount)
    {
        var type = new ModifierType
        {
            Id = Guid.NewGuid(),
            Name = name,
            DefaultDuration = 3,
            IconKey = ModifierIconKeys.Default,
            DamageMode = DamageMode.Fixed,
            DamageAmount = amount,
            HealMode = DamageMode.None,
        };
        _testDb.Context.ModifierTypes.Add(type);
        _testDb.Context.SaveChanges();
        return type.Id;
    }

    private Guid SeedSheet(
        string name,
        SheetType type,
        int currentHp,
        int maxHp,
        string? imageUrl = null,
        double imageFocusX = 50,
        double imageFocusY = 50,
        double imageScale = SheetRules.ImageScaleDefault)
    {
        var sheet = new Sheet
        {
            Id = Guid.NewGuid(),
            CampaignId = _campaignId,
            Name = name,
            Type = type,
            Class = CharacterClass.None,
            MaxHp = maxHp,
            CurrentHp = currentHp,
            BaseAc = 12,
            Dexterity = 14,
            DexModifier = 2,
            InitiativeBonus = 0,
            ImageUrl = imageUrl,
            ImageFocusX = imageFocusX,
            ImageFocusY = imageFocusY,
            ImageScale = imageScale,
        };
        _testDb.Context.Sheets.Add(sheet);
        _testDb.Context.SaveChanges();
        return sheet.Id;
    }
}
