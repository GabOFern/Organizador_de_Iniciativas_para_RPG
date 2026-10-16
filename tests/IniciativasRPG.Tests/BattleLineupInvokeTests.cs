using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Domain;
using IniciativasRPG.Api.Services;
using IniciativasRPG.Tests.Helpers;

namespace IniciativasRPG.Tests;

public class BattleLineupInvokeTests : IAsyncDisposable
{
    private readonly TestDb _testDb = TestDb.Create();
    private readonly FakeDiceService _dice = new();
    private readonly LineupService _lineups;
    private readonly BattleService _battle;
    private readonly Guid _campaignId;

    public BattleLineupInvokeTests()
    {
        _campaignId = _testDb.SeedCampaign();
        _lineups = new LineupService(_testDb.Context);
        _battle = new BattleService(_testDb.Context, _dice, new FakeBattleNotifier());
    }

    public ValueTask DisposeAsync() => _testDb.DisposeAsync();

    [Fact]
    public async Task InvokeLineup_AddsBesideExistingCombatants()
    {
        var diana = Seed("Diana", SheetType.Player, 3);
        var skeleton = Seed("Esqueleto", SheetType.Creature, 2);
        await _battle.InvokePlayerAsync(_campaignId, new InvokePlayerRequest(diana, 18));
        var cemetery = await _lineups.CreateAsync(_campaignId, Scene("Cemitério", skeleton));

        var snapshot = await _battle.InvokeLineupAsync(
            _campaignId,
            new InvokeLineupRequest(cemetery.Id, [new InvokeLineupMemberRequest(skeleton, 7, false)]));

        snapshot.Combatants.Select(c => c.Name).Should().BeEquivalentTo("Diana", "Esqueleto");
        snapshot.Combatants.Should().Contain(c => c.Name == "Diana" && c.Initiative == 18);
        snapshot.Message.Should().Be("Cena Cemitério: Esqueleto 7.");
    }

    [Fact]
    public async Task InvokeLineup_PlayerAlreadyIn_SkipsOnlyThatPlayer()
    {
        var diana = Seed("Diana", SheetType.Player, 3);
        var howl = Seed("Howl", SheetType.Player, 2);
        await _battle.InvokePlayerAsync(_campaignId, new InvokePlayerRequest(diana, 5));
        var players = await _lineups.CreateAsync(_campaignId, Scene("Jogadores", diana, howl));

        var snapshot = await _battle.InvokeLineupAsync(
            _campaignId,
            new InvokeLineupRequest(
                players.Id,
                [
                    new InvokeLineupMemberRequest(diana, 20, false),
                    new InvokeLineupMemberRequest(howl, 11, false),
                ]));

        snapshot.Combatants.Should().HaveCount(2);
        snapshot.Combatants.Should().ContainSingle(c => c.Name == "Diana").Which.Initiative.Should().Be(5);
        snapshot.Combatants.Should().ContainSingle(c => c.Name == "Howl").Which.Initiative.Should().Be(11);
        snapshot.Message.Should().Be("Cena Jogadores: Howl 11. Já na fila: Diana.");
    }

    [Fact]
    public async Task InvokeLineup_RollsInitiative_WhenAsked()
    {
        var skeleton = Seed("Esqueleto", SheetType.Creature, 2);
        var cemetery = await _lineups.CreateAsync(_campaignId, Scene("Cemitério", skeleton));
        _dice.Enqueue(14);

        var snapshot = await _battle.InvokeLineupAsync(
            _campaignId,
            new InvokeLineupRequest(cemetery.Id, [new InvokeLineupMemberRequest(skeleton, null, true)]));

        snapshot.Combatants.Should().ContainSingle().Which.Initiative.Should().Be(14);
        snapshot.Combatants[0].HideHpFromPublic.Should().BeTrue();
        snapshot.LastDiceRoll.Should().Be(14);
    }

    [Fact]
    public async Task InvokeLineup_MembersMismatch_ChangesNothing()
    {
        var diana = Seed("Diana", SheetType.Player, 3);
        var howl = Seed("Howl", SheetType.Player, 2);
        await _battle.InvokePlayerAsync(_campaignId, new InvokePlayerRequest(diana, 8));
        var players = await _lineups.CreateAsync(_campaignId, Scene("Jogadores", diana, howl));

        var act = () => _battle.InvokeLineupAsync(
            _campaignId,
            new InvokeLineupRequest(players.Id, [new InvokeLineupMemberRequest(diana, 1, false)]));

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.LineupMembersMismatch);
        (await _testDb.Context.Combatants.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task InvokeLineup_Quantity_AddsOneCombatantPerCopy()
    {
        var bell = Seed("Sino", SheetType.Creature, 0);
        var cemetery = await _lineups.CreateAsync(
            _campaignId,
            new SaveLineupRequest("Cemitério", [new SaveLineupMemberRequest(bell, 3)]));
        _dice.Enqueue(12);
        _dice.Enqueue(8);

        var snapshot = await _battle.InvokeLineupAsync(
            _campaignId,
            new InvokeLineupRequest(
                cemetery.Id,
                [
                    new InvokeLineupMemberRequest(bell, null, true),
                    new InvokeLineupMemberRequest(bell, 4, false),
                    new InvokeLineupMemberRequest(bell, null, true),
                ]));

        snapshot.Combatants.Select(c => c.Initiative).Should().Equal(12, 8, 4);
        snapshot.Combatants.Should().OnlyContain(c => c.Name == "Sino");
        snapshot.Message.Should().Be("Cena Cemitério: Sino 12, Sino 4, Sino 8.");
    }

    private static SaveLineupRequest Scene(string name, params Guid[] sheetIds) =>
        new(name, sheetIds.Select(id => new SaveLineupMemberRequest(id, LineupRules.MinQuantity)).ToList());

    private Guid Seed(string name, SheetType type, int initiativeBonus)
    {
        var sheet = new Sheet
        {
            Id = Guid.NewGuid(),
            CampaignId = _campaignId,
            Name = name,
            Type = type,
            Class = CharacterClass.None,
            MaxHp = 10,
            CurrentHp = 10,
            BaseAc = 12,
            Dexterity = 14,
            DexModifier = 2,
            InitiativeBonus = initiativeBonus,
        };
        _testDb.Context.Sheets.Add(sheet);
        _testDb.Context.SaveChanges();
        return sheet.Id;
    }
}
