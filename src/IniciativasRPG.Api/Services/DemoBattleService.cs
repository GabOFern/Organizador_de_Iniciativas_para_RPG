using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Services;

public interface IDemoBattleService
{
    Task<BattleSnapshotDto> StartTestBattleAsync(Guid campaignId, CancellationToken ct = default);
    Task<BattleSnapshotDto> TickTestBattleAsync(Guid campaignId, CancellationToken ct = default);
}

public class DemoBattleService : IDemoBattleService
{
    private readonly AppDbContext _db;
    private readonly IBattleService _battleService;
    private readonly IDiceService _diceService;
    private readonly IDemoBattleRandom _random;

    public DemoBattleService(
        AppDbContext db,
        IBattleService battleService,
        IDiceService diceService,
        IDemoBattleRandom random)
    {
        _db = db;
        _battleService = battleService;
        _diceService = diceService;
        _random = random;
    }

    public Task<BattleSnapshotDto> StartTestBattleAsync(Guid campaignId, CancellationToken ct = default) =>
        StartTestBattleCoreAsync(campaignId, DemoBattleRules.StartedMessage(), ct);

    private async Task<BattleSnapshotDto> StartTestBattleCoreAsync(
        Guid campaignId,
        string startMessage,
        CancellationToken ct)
    {
        var sheets = await LoadRequiredSheetsAsync(campaignId, ct);

        var open = await _db.Battles
            .AsNoTracking()
            .AnyAsync(
                b => b.CampaignId == campaignId &&
                     (b.Status == BattleStatus.Preparing || b.Status == BattleStatus.Active),
                ct);
        if (open)
        {
            await _battleService.FinishAsync(campaignId, ct: ct);
        }

        foreach (var sheet in sheets)
        {
            await _battleService.InvokeCreatureAsync(
                campaignId,
                new InvokeCreatureRequest(
                    sheet.Id,
                    Initiative: null,
                    RollDice: true,
                    DiceNotation: null,
                    HideHpFromPublic: false),
                ct);
        }

        var battle = await _db.Battles
            .Where(b =>
                b.CampaignId == campaignId &&
                (b.Status == BattleStatus.Preparing || b.Status == BattleStatus.Active))
            .OrderByDescending(b => b.CreatedAtUtc)
            .FirstAsync(ct);

        battle.IsTestBattle = true;
        battle.LastActionMessage = startMessage;
        battle.LastActionDiceRoll = null;
        await _db.SaveChangesAsync(ct);

        return await _battleService.StartAsync(campaignId, ct);
    }

    private Task<BattleSnapshotDto> RestartRoundAsync(
        Guid campaignId,
        string winnerName,
        CancellationToken ct) =>
        StartTestBattleCoreAsync(campaignId, DemoBattleRules.RestartedMessage(winnerName), ct);

    public async Task<BattleSnapshotDto> TickTestBattleAsync(Guid campaignId, CancellationToken ct = default)
    {
        var battle = await _db.Battles
            .Where(b =>
                b.CampaignId == campaignId &&
                b.Status == BattleStatus.Active &&
                b.IsTestBattle)
            .OrderByDescending(b => b.CreatedAtUtc)
            .FirstOrDefaultAsync(ct)
            ?? throw new DomainException(DomainMessages.DemoBattleNotActive);

        var ordered = await _db.Combatants
            .Include(c => c.Sheet)
            .ThenInclude(s => s.Attacks)
            .Where(c => c.BattleId == battle.Id)
            .OrderBy(c => c.SortOrder)
            .ToListAsync(ct);

        if (ordered.Count == 0)
        {
            throw new DomainException(DomainMessages.NotEnoughCombatants);
        }

        var living = ordered.Where(c => !c.IsDead).ToList();
        if (living.Count < BattleRules.MinCombatantsToStart)
        {
            var winner = living.FirstOrDefault()?.Sheet.Name ?? "ninguém";
            return await RestartRoundAsync(campaignId, winner, ct);
        }

        var turnIndex = battle.CurrentTurnIndex;
        if (turnIndex < 0 || turnIndex >= ordered.Count)
        {
            return await AdvanceAfterActionAsync(campaignId, battle.Id, null, null, ct);
        }

        var actor = ordered[turnIndex];
        if (actor.IsDead)
        {
            return await AdvanceAfterActionAsync(campaignId, battle.Id, null, null, ct);
        }

        var foes = living.Where(c => c.Id != actor.Id).ToList();
        if (foes.Count == 0)
        {
            return await RestartRoundAsync(campaignId, actor.Sheet.Name, ct);
        }

        if (actor.CurrentHp < actor.MaxHp &&
            _random.NextPercent() < DemoBattleRules.HealChancePercent)
        {
            var healAmount = _diceService.Roll(DemoBattleRules.HealDice);
            await _battleService.ApplyHealAsync(
                campaignId,
                new HealRequest(actor.Id, healAmount),
                ct);

            return await AdvanceAfterActionAsync(
                campaignId,
                battle.Id,
                DemoBattleRules.HealMessage(actor.Sheet.Name, healAmount),
                healAmount,
                ct);
        }

        var attacks = actor.Sheet.Attacks.OrderBy(a => a.SortOrder).ToList();
        if (attacks.Count == 0)
        {
            throw new DomainException(DomainMessages.DemoBattleActorHasNoAttack);
        }

        var attack = attacks[_random.NextIndex(attacks.Count)];
        var target = foes[_random.NextIndex(foes.Count)];

        var abilityScore = AttackResolution.AbilityScoreOf(actor.Sheet, attack.AbilityBase);
        var abilityMod = AbilityScores.Modifier(abilityScore);
        var hitBonus = AttackResolution.HitBonus(actor.Sheet.ProficiencyBonus, abilityMod);

        var natural = _diceService.Roll(DemoBattleRules.AttackDice);
        var totalToHit = AttackResolution.TotalToHit(natural, hitBonus);
        var hit = AttackResolution.DoesHit(natural, hitBonus, target.CurrentAc);

        string message;
        if (hit)
        {
            var diceDamage = _diceService.Roll(attack.DamageDice);
            var damage = AttackResolution.DamageTotal(diceDamage, abilityMod);
            await _battleService.ApplyDamageAsync(
                campaignId,
                new DamageRequest(target.Id, damage),
                ct);

            message = DemoBattleRules.HitMessage(
                actor.Sheet.Name,
                target.Sheet.Name,
                attack.Description,
                totalToHit,
                target.CurrentAc,
                damage);

            var targetAfter = await _db.Combatants
                .AsNoTracking()
                .FirstAsync(c => c.Id == target.Id, ct);
            if (targetAfter.CurrentHp <= BattleRules.MinHp)
            {
                await _battleService.KillAsync(campaignId, new KillRequest(target.Id), ct);
                message += DemoBattleRules.KillSuffix(target.Sheet.Name);
            }
        }
        else
        {
            message = DemoBattleRules.MissMessage(
                actor.Sheet.Name,
                target.Sheet.Name,
                attack.Description,
                totalToHit,
                target.CurrentAc);
        }

        var stillLiving = await _db.Combatants
            .AsNoTracking()
            .CountAsync(c => c.BattleId == battle.Id && !c.IsDead, ct);
        if (stillLiving < BattleRules.MinCombatantsToStart)
        {
            var winner = await _db.Combatants
                .AsNoTracking()
                .Include(c => c.Sheet)
                .Where(c => c.BattleId == battle.Id && !c.IsDead)
                .Select(c => c.Sheet.Name)
                .FirstOrDefaultAsync(ct) ?? actor.Sheet.Name;

            return await RestartRoundAsync(campaignId, winner, ct);
        }

        return await AdvanceAfterActionAsync(campaignId, battle.Id, message, natural, ct);
    }

    private async Task<IReadOnlyList<Sheet>> LoadRequiredSheetsAsync(Guid campaignId, CancellationToken ct)
    {
        var names = DemoBattleRules.RequiredSheetNames.ToArray();
        var sheets = await _db.Sheets
            .AsNoTracking()
            .Where(s => s.CampaignId == campaignId && names.Contains(s.Name))
            .ToListAsync(ct);

        if (sheets.Count < names.Length ||
            names.Any(n => sheets.All(s => s.Name != n)))
        {
            throw new DomainException(DomainMessages.DemoBattleSheetsMissing);
        }

        return names
            .Select(n => sheets.First(s => s.Name == n))
            .ToList();
    }

    private async Task<BattleSnapshotDto> AdvanceAfterActionAsync(
        Guid campaignId,
        Guid battleId,
        string? message,
        int? diceRoll,
        CancellationToken ct)
    {
        await SetLastActionAsync(battleId, message, diceRoll, ct);
        return await _battleService.NextAsync(campaignId, ct);
    }

    private async Task SetLastActionAsync(
        Guid battleId,
        string? message,
        int? diceRoll,
        CancellationToken ct)
    {
        var battle = await _db.Battles.FirstAsync(b => b.Id == battleId, ct);
        if (message is not null)
        {
            battle.LastActionMessage = message;
        }

        battle.LastActionDiceRoll = diceRoll;
        await _db.SaveChangesAsync(ct);
    }
}
