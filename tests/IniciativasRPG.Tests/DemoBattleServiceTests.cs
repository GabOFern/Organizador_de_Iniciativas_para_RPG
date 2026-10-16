using FluentAssertions;
using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using IniciativasRPG.Api.Services;
using IniciativasRPG.Tests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Tests;

public class DemoBattleServiceTests : IAsyncDisposable
{
    private readonly TestDb _testDb = TestDb.Create();
    private readonly FakeDiceService _dice = new();
    private readonly FakeDemoBattleRandom _random = new();
    private readonly FakeBattleNotifier _notifier = new();
    private readonly Guid _campaignId;
    private readonly BattleService _battleService;
    private readonly DemoBattleService _demo;

    public DemoBattleServiceTests()
    {
        _campaignId = _testDb.SeedCampaign();
        _battleService = new BattleService(_testDb.Context, _dice, _notifier);
        _demo = new DemoBattleService(_testDb.Context, _battleService, _dice, _random);
    }

    public ValueTask DisposeAsync() => _testDb.DisposeAsync();

    [Fact]
    public async Task Start_InvokesThreeCombatants_RollsInitiative_StartsActive()
    {
        await SeedRequiredSheetsAsync();
        _dice.Enqueue(18, 12, 7);

        var snapshot = await _demo.StartTestBattleAsync(_campaignId);

        snapshot.Status.Should().Be(BattleStatus.Active.ToString());
        snapshot.IsTestBattle.Should().BeTrue();
        snapshot.Combatants.Should().HaveCount(3);
        snapshot.Combatants.Select(c => c.Name).Should().BeEquivalentTo(DemoBattleRules.RequiredSheetNames);
        snapshot.Combatants.Should().OnlyContain(c => !c.HideHpFromPublic);
        snapshot.Message.Should().Be(DemoBattleRules.StartedMessage());

        var initiatives = snapshot.Combatants.ToDictionary(c => c.Name, c => c.Initiative);
        initiatives["Guarda Veterano"].Should().Be(18);
        initiatives["Goblin"].Should().Be(12);
        initiatives["Lobo"].Should().Be(7);
    }

    [Fact]
    public async Task Start_MissingSheet_Throws()
    {
        await SampleNpcSheetSeeder.ApplyForCampaignAsync(_testDb.Context, _campaignId);
        var goblin = await _testDb.Context.Sheets.SingleAsync(
            s => s.CampaignId == _campaignId && s.Name == "Goblin");
        _testDb.Context.Sheets.Remove(goblin);
        await _testDb.Context.SaveChangesAsync();
        _testDb.Context.ChangeTracker.Clear();

        var act = () => _demo.StartTestBattleAsync(_campaignId);

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage(DomainMessages.DemoBattleSheetsMissing);
    }

    [Fact]
    public async Task Tick_Hit_AppliesDamageAndAdvancesTurn()
    {
        await SeedRequiredSheetsAsync();
        // Guarda first, then Goblin, then Lobo
        _dice.Enqueue(20, 10, 5);
        await _demo.StartTestBattleAsync(_campaignId);
        _testDb.Context.ChangeTracker.Clear();

        _random.EnqueuePercent(99);
        _random.EnqueueIndex(0, 0); // attack, target = Goblin (first foe after Guarda)
        _dice.Enqueue(18); // d20 → 18+4 = 22 vs CA 15
        _dice.Enqueue(1); // 1d8 → 1+2 = 3 damage (Goblin sobrevive)

        var before = await CurrentCombatantsAsync();
        var goblinBefore = before.Single(c => c.Sheet.Name == "Goblin").CurrentHp;

        var snapshot = await _demo.TickTestBattleAsync(_campaignId);

        var goblinAfter = snapshot.Combatants.Single(c => c.Name == "Goblin");
        goblinAfter.CurrentHp.Should().Be(goblinBefore - 3);
        goblinAfter.IsDead.Should().BeFalse();
        snapshot.Message.Should().Contain("acerto").And.Contain("3 de dano");
        snapshot.LastDiceRoll.Should().Be(18);
        snapshot.Combatants.Count(c => c.IsCurrentTurn).Should().Be(1);
        snapshot.Combatants.Single(c => c.IsCurrentTurn).Name.Should().NotBe("Guarda Veterano");
    }

    [Fact]
    public async Task Tick_Miss_NoDamage_AdvancesTurn()
    {
        await SeedRequiredSheetsAsync();
        _dice.Enqueue(20, 10, 5);
        await _demo.StartTestBattleAsync(_campaignId);
        _testDb.Context.ChangeTracker.Clear();

        _random.EnqueuePercent(99);
        _random.EnqueueIndex(0, 0);
        _dice.Enqueue(2); // 2+4 = 6 vs CA 15 → miss

        var beforeHp = (await CurrentCombatantsAsync()).ToDictionary(c => c.Sheet.Name, c => c.CurrentHp);

        var snapshot = await _demo.TickTestBattleAsync(_campaignId);

        foreach (var c in snapshot.Combatants)
        {
            c.CurrentHp.Should().Be(beforeHp[c.Name]);
        }

        snapshot.Message.Should().Contain("errou");
        snapshot.LastDiceRoll.Should().Be(2);
    }

    [Fact]
    public async Task Tick_DamageToZero_KillsCombatant()
    {
        await SeedRequiredSheetsAsync();
        _dice.Enqueue(20, 10, 5);
        await _demo.StartTestBattleAsync(_campaignId);

        var goblin = await _testDb.Context.Combatants
            .Include(c => c.Sheet)
            .SingleAsync(c => c.Sheet.Name == "Goblin");
        goblin.CurrentHp = 2;
        await _testDb.Context.SaveChangesAsync();
        _testDb.Context.ChangeTracker.Clear();

        _random.EnqueuePercent(99);
        _random.EnqueueIndex(0, 0); // Guarda → Goblin
        _dice.Enqueue(18);
        _dice.Enqueue(4); // 4+2 = 6 ≥ 2

        var snapshot = await _demo.TickTestBattleAsync(_campaignId);

        var goblinSnap = snapshot.Combatants.Single(c => c.Name == "Goblin");
        goblinSnap.IsDead.Should().BeTrue();
        goblinSnap.CurrentHp.Should().Be(0);
        snapshot.Message.Should().Contain("morre");
    }

    [Fact]
    public async Task Tick_HealBranch_AppliesHeal()
    {
        await SeedRequiredSheetsAsync();
        _dice.Enqueue(20, 10, 5);
        await _demo.StartTestBattleAsync(_campaignId);

        var guarda = await _testDb.Context.Combatants
            .Include(c => c.Sheet)
            .SingleAsync(c => c.Sheet.Name == "Guarda Veterano");
        guarda.CurrentHp = 10;
        await _testDb.Context.SaveChangesAsync();
        _testDb.Context.ChangeTracker.Clear();

        _random.EnqueuePercent(0); // force heal (< 15)
        _dice.Enqueue(3); // 1d4 heal

        var snapshot = await _demo.TickTestBattleAsync(_campaignId);

        snapshot.Combatants.Single(c => c.Name == "Guarda Veterano").CurrentHp.Should().Be(13);
        snapshot.Message.Should().Be(DemoBattleRules.HealMessage("Guarda Veterano", 3));
    }

    [Fact]
    public async Task Tick_OneSurvivor_RestartsTestBattle()
    {
        await SeedRequiredSheetsAsync();
        _dice.Enqueue(20, 10, 5);
        await _demo.StartTestBattleAsync(_campaignId);

        var combatants = await _testDb.Context.Combatants
            .Include(c => c.Sheet)
            .Where(c => c.Sheet.CampaignId == _campaignId)
            .ToListAsync();
        foreach (var c in combatants.Where(c => c.Sheet.Name != "Guarda Veterano"))
        {
            c.CurrentHp = 0;
            c.IsDead = true;
        }

        await _testDb.Context.SaveChangesAsync();
        _testDb.Context.ChangeTracker.Clear();

        // Nova rodada: 3 iniciativas
        _dice.Enqueue(15, 11, 8);

        var snapshot = await _demo.TickTestBattleAsync(_campaignId);

        snapshot.Status.Should().Be(BattleStatus.Active.ToString());
        snapshot.IsTestBattle.Should().BeTrue();
        snapshot.Combatants.Should().HaveCount(3);
        snapshot.Combatants.Should().OnlyContain(c => !c.IsDead && c.CurrentHp == c.MaxHp);
        snapshot.Message.Should().Be(DemoBattleRules.RestartedMessage("Guarda Veterano"));
    }

    [Fact]
    public async Task Tick_WhenNotTestBattle_Throws()
    {
        await SeedRequiredSheetsAsync();
        var required = DemoBattleRules.RequiredSheetNames.ToArray();
        var sheets = await _testDb.Context.Sheets
            .Where(s => s.CampaignId == _campaignId && required.Contains(s.Name))
            .Take(2)
            .ToListAsync();

        await _battleService.InvokeCreatureAsync(
            _campaignId,
            new InvokeCreatureRequest(sheets[0].Id, 10, false, null, false));
        await _battleService.InvokeCreatureAsync(
            _campaignId,
            new InvokeCreatureRequest(sheets[1].Id, 8, false, null, false));
        await _battleService.StartAsync(_campaignId);

        var act = () => _demo.TickTestBattleAsync(_campaignId);

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage(DomainMessages.DemoBattleNotActive);
    }

    private async Task SeedRequiredSheetsAsync()
    {
        await SampleNpcSheetSeeder.ApplyForCampaignAsync(_testDb.Context, _campaignId);
        _testDb.Context.ChangeTracker.Clear();
    }

    private Task<List<Combatant>> CurrentCombatantsAsync() =>
        _testDb.Context.Combatants
            .Include(c => c.Sheet)
            .Where(c => c.Sheet.CampaignId == _campaignId)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();
}
