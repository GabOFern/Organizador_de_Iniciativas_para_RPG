using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Services;

public interface IBattleService
{
    Task<BattleSnapshotDto> GetCurrentAsync(Guid campaignId, CancellationToken ct = default);
    Task<BattleSnapshotDto> GetByPublicTokenAsync(string token, bool forPublic = false, CancellationToken ct = default);
    Task<BattleSnapshotDto> InvokePlayerAsync(Guid campaignId, InvokePlayerRequest request, CancellationToken ct = default);
    Task<BattleSnapshotDto> InvokeCreatureAsync(Guid campaignId, InvokeCreatureRequest request, CancellationToken ct = default);
    Task<BattleSnapshotDto> StartAsync(Guid campaignId, CancellationToken ct = default);
    Task<BattleSnapshotDto> NextAsync(Guid campaignId, CancellationToken ct = default);
    Task<BattleSnapshotDto> FinishAsync(Guid campaignId, CancellationToken ct = default);
    Task<BattleSnapshotDto> SavePlayerStatsAsync(Guid campaignId, CancellationToken ct = default);
    Task<BattleSnapshotDto> ApplyDamageAsync(Guid campaignId, DamageRequest request, CancellationToken ct = default);
    Task<BattleSnapshotDto> ApplyHealAsync(Guid campaignId, HealRequest request, CancellationToken ct = default);
    Task<BattleSnapshotDto> KillAsync(Guid campaignId, KillRequest request, CancellationToken ct = default);
    Task<BattleSnapshotDto> ReviveAsync(Guid campaignId, ReviveRequest request, CancellationToken ct = default);
    Task<BattleSnapshotDto> ApplyModifierAsync(Guid campaignId, ApplyModifierRequest request, CancellationToken ct = default);
    Task<BattleSnapshotDto> RemoveModifierAsync(Guid campaignId, Guid activeModifierId, CancellationToken ct = default);
    Task<CombatantTacticalDto> GetCombatantTacticalAsync(Guid campaignId, Guid combatantId, CancellationToken ct = default);
}

public class BattleService : IBattleService
{
    private readonly AppDbContext _db;
    private readonly IDiceService _diceService;
    private readonly IBattleNotifier _notifier;

    public BattleService(AppDbContext db, IDiceService diceService, IBattleNotifier notifier)
    {
        _db = db;
        _diceService = diceService;
        _notifier = notifier;
    }

    public async Task<BattleSnapshotDto> GetCurrentAsync(Guid campaignId, CancellationToken ct = default)
    {
        var battleId = await FindOpenBattleIdAsync(campaignId, ct);
        if (battleId is null)
        {
            return EmptySnapshot(DomainMessages.NoPublicBattle);
        }

        return await BuildSnapshotAsync(battleId.Value, ct: ct);
    }

    public async Task<BattleSnapshotDto> GetByPublicTokenAsync(
        string token,
        bool forPublic = false,
        CancellationToken ct = default)
    {
        var campaign = await _db.Campaigns
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.PublicToken == token, ct);

        if (campaign is null)
        {
            return EmptySnapshot(DomainMessages.NoPublicBattle);
        }

        var battleId = await FindOpenBattleIdAsync(campaign.Id, ct);
        if (battleId is null)
        {
            return EmptySnapshot(DomainMessages.NoPublicBattle, campaign.PublicToken);
        }

        return await BuildSnapshotAsync(battleId.Value, forPublic: forPublic, ct: ct);
    }

    public async Task<BattleSnapshotDto> InvokePlayerAsync(
        Guid campaignId,
        InvokePlayerRequest request,
        CancellationToken ct = default)
    {
        var sheet = await _db.Sheets.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == request.SheetId && s.CampaignId == campaignId, ct)
            ?? throw new DomainException(DomainMessages.SheetNotFound, StatusCodes.Status404NotFound);

        if (sheet.Type != SheetType.Player)
        {
            throw new DomainException(DomainMessages.SheetMustBePlayer);
        }

        var battleId = await EnsureOpenBattleIdAsync(campaignId, ct);

        var alreadyIn = await _db.Combatants.AnyAsync(
            c => c.BattleId == battleId && c.SheetId == sheet.Id,
            ct);

        if (alreadyIn && !request.ConfirmDuplicate)
        {
            throw new DomainException(DomainMessages.PlayerAlreadyInBattle, StatusCodes.Status409Conflict);
        }

        await InsertCombatantAsync(battleId, sheet, request.Initiative, hideHpFromPublic: false, ct);
        await ReorderAsync(battleId, ct);

        return await BuildAndNotifyAsync(battleId, ct: ct);
    }

    public async Task<BattleSnapshotDto> InvokeCreatureAsync(
        Guid campaignId,
        InvokeCreatureRequest request,
        CancellationToken ct = default)
    {
        var sheet = await _db.Sheets.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == request.SheetId && s.CampaignId == campaignId, ct)
            ?? throw new DomainException(DomainMessages.SheetNotFound, StatusCodes.Status404NotFound);

        if (sheet.Type is not (SheetType.Creature or SheetType.Npc))
        {
            throw new DomainException(DomainMessages.SheetMustBeNonPlayer);
        }

        int initiative;
        int? diceRoll = null;

        if (request.RollDice)
        {
            var notation = string.IsNullOrWhiteSpace(request.DiceNotation)
                ? "1d20"
                : request.DiceNotation!;
            diceRoll = _diceService.Roll(notation);
            initiative = diceRoll.Value;
        }
        else
        {
            if (!request.Initiative.HasValue)
            {
                throw new DomainException("Informe a iniciativa ou escolha rolar o dado.");
            }

            initiative = request.Initiative.Value;
        }

        var battleId = await EnsureOpenBattleIdAsync(campaignId, ct);
        await InsertCombatantAsync(battleId, sheet, initiative, request.HideHpFromPublic, ct);
        await ReorderAsync(battleId, ct);

        return await BuildAndNotifyAsync(battleId, lastDiceRoll: diceRoll, ct: ct);
    }

    public async Task<BattleSnapshotDto> StartAsync(Guid campaignId, CancellationToken ct = default)
    {
        var battle = await LoadTrackedBattleAsync(campaignId, ct)
            ?? throw new DomainException(DomainMessages.BattleNotFound);

        if (battle.Status == BattleStatus.Active)
        {
            throw new DomainException(DomainMessages.BattleAlreadyStarted);
        }

        var count = await _db.Combatants.CountAsync(c => c.BattleId == battle.Id, ct);
        if (count < BattleRules.MinCombatantsToStart)
        {
            throw new DomainException(DomainMessages.NotEnoughCombatants);
        }

        await ReorderAsync(battle.Id, ct);

        var ordered = await _db.Combatants
            .Where(c => c.BattleId == battle.Id)
            .OrderBy(c => c.SortOrder)
            .ToListAsync(ct);

        battle.Status = BattleStatus.Active;
        battle.CurrentTurnIndex = FindNextEligibleIndex(ordered, -1);
        await _db.SaveChangesAsync(ct);

        var tickEvents = await ResolveDamageTicksForCurrentAsync(battle, ordered, ct);
        await RecalcAcForBattleAsync(battle.Id, ct);
        await _db.SaveChangesAsync(ct);

        return await BuildAndNotifyAsync(battle.Id, lastTickEvents: tickEvents, ct: ct);
    }

    public async Task<BattleSnapshotDto> NextAsync(Guid campaignId, CancellationToken ct = default)
    {
        var battle = await LoadTrackedBattleAsync(campaignId, ct)
            ?? throw new DomainException(DomainMessages.BattleNotFound);

        if (battle.Status != BattleStatus.Active)
        {
            throw new DomainException(DomainMessages.BattleNotActive);
        }

        var ordered = await _db.Combatants
            .Where(c => c.BattleId == battle.Id)
            .OrderBy(c => c.SortOrder)
            .ToListAsync(ct);

        if (ordered.Count == 0)
        {
            throw new DomainException(DomainMessages.NotEnoughCombatants);
        }

        var previousIndex = battle.CurrentTurnIndex;
        var nextIndex = FindNextEligibleIndex(ordered, previousIndex);
        var completedRound = DidCompleteRound(previousIndex, nextIndex, ordered.Count);

        ConsumeSkipTurnBetween(ordered, previousIndex, nextIndex);
        battle.CurrentTurnIndex = nextIndex;

        var tickEvents = await ResolveDamageTicksForCurrentAsync(battle, ordered, ct);

        if (completedRound)
        {
            await DecrementModifiersForBattleAsync(battle.Id, ct);
            await RearmSkipTurnFlagsAsync(battle.Id, ct);
        }

        await RecalcAcForBattleAsync(battle.Id, ct);
        await _db.SaveChangesAsync(ct);

        return await BuildAndNotifyAsync(battle.Id, lastTickEvents: tickEvents, ct: ct);
    }

    public async Task<BattleSnapshotDto> FinishAsync(Guid campaignId, CancellationToken ct = default)
    {
        var battle = await LoadTrackedBattleAsync(campaignId, ct)
            ?? throw new DomainException(DomainMessages.BattleNotFound);

        if (battle.Status == BattleStatus.Finished)
        {
            throw new DomainException(DomainMessages.BattleNotActive);
        }

        var token = await GetCampaignPublicTokenAsync(battle.CampaignId, ct);
        battle.Status = BattleStatus.Finished;
        await _db.SaveChangesAsync(ct);

        var canSave = await CanSavePlayerStatsForBattleAsync(battle.Id, ct);
        var snapshot = EmptySnapshot(DomainMessages.NoPublicBattle, token, canSave);
        await _notifier.NotifyBattleUpdatedAsync(token, masterSnapshot: snapshot, ct);
        return snapshot;
    }

    public async Task<BattleSnapshotDto> SavePlayerStatsAsync(Guid campaignId, CancellationToken ct = default)
    {
        var battle = await _db.Battles
            .Where(b => b.CampaignId == campaignId && b.Status == BattleStatus.Finished)
            .OrderByDescending(b => b.CreatedAtUtc)
            .FirstOrDefaultAsync(ct)
            ?? throw new DomainException(DomainMessages.NoFinishedBattleToSave);

        if (battle.PlayerStatsSavedAtUtc is not null)
        {
            throw new DomainException(DomainMessages.PlayerStatsAlreadySaved, StatusCodes.Status409Conflict);
        }

        var combatants = await _db.Combatants
            .Include(c => c.Sheet)
            .Where(c => c.BattleId == battle.Id)
            .OrderBy(c => c.SortOrder)
            .ToListAsync(ct);

        var playerCombatants = combatants
            .Where(c => c.Sheet.Type == SheetType.Player)
            .ToList();

        if (playerCombatants.Count == 0)
        {
            throw new DomainException(DomainMessages.NoPlayersToSave);
        }

        // Last SortOrder wins when the same sheet appears more than once.
        foreach (var group in playerCombatants.GroupBy(c => c.SheetId))
        {
            var source = group.OrderBy(c => c.SortOrder).Last();
            var sheet = source.Sheet;
            sheet.CurrentHp = Math.Clamp(source.CurrentHp, BattleRules.MinHp, sheet.MaxHp);
            sheet.BaseAc = source.BaseAc;
        }

        battle.PlayerStatsSavedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var token = await GetCampaignPublicTokenAsync(campaignId, ct);
        var snapshot = EmptySnapshot(DomainMessages.PlayerStatsSaved, token, canSavePlayerStats: false);
        await _notifier.NotifyBattleUpdatedAsync(token, masterSnapshot: snapshot, ct);
        return snapshot;
    }

    private async Task<bool> CanSavePlayerStatsForBattleAsync(Guid battleId, CancellationToken ct)
    {
        var battle = await _db.Battles.AsNoTracking().FirstAsync(b => b.Id == battleId, ct);
        if (battle.Status != BattleStatus.Finished || battle.PlayerStatsSavedAtUtc is not null)
        {
            return false;
        }

        return await _db.Combatants
            .AsNoTracking()
            .AnyAsync(c => c.BattleId == battleId && c.Sheet.Type == SheetType.Player, ct);
    }

    public async Task<BattleSnapshotDto> ApplyDamageAsync(Guid campaignId, DamageRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
        {
            throw new DomainException(DomainMessages.DamageMustBePositive);
        }

        var battleId = await FindOpenBattleIdAsync(campaignId, ct)
            ?? throw new DomainException(DomainMessages.BattleNotFound);

        var combatant = await _db.Combatants
            .FirstOrDefaultAsync(c => c.Id == request.CombatantId && c.BattleId == battleId, ct)
            ?? throw new DomainException(DomainMessages.CombatantNotFound, StatusCodes.Status404NotFound);

        combatant.CurrentHp = Math.Max(BattleRules.MinHp, combatant.CurrentHp - request.Amount);
        await _db.SaveChangesAsync(ct);

        return await BuildAndNotifyAsync(battleId, ct: ct);
    }

    public async Task<BattleSnapshotDto> ApplyHealAsync(Guid campaignId, HealRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
        {
            throw new DomainException(DomainMessages.HealMustBePositive);
        }

        var battleId = await FindOpenBattleIdAsync(campaignId, ct)
            ?? throw new DomainException(DomainMessages.BattleNotFound);

        var combatant = await _db.Combatants
            .FirstOrDefaultAsync(c => c.Id == request.CombatantId && c.BattleId == battleId, ct)
            ?? throw new DomainException(DomainMessages.CombatantNotFound, StatusCodes.Status404NotFound);

        if (combatant.IsDead)
        {
            throw new DomainException(DomainMessages.HealBlockedWhileDead);
        }

        combatant.CurrentHp = Math.Min(combatant.MaxHp, combatant.CurrentHp + request.Amount);
        await _db.SaveChangesAsync(ct);

        return await BuildAndNotifyAsync(battleId, ct: ct);
    }

    public async Task<BattleSnapshotDto> KillAsync(Guid campaignId, KillRequest request, CancellationToken ct = default)
    {
        var battleId = await FindOpenBattleIdAsync(campaignId, ct)
            ?? throw new DomainException(DomainMessages.BattleNotFound);

        var combatant = await _db.Combatants
            .FirstOrDefaultAsync(c => c.Id == request.CombatantId && c.BattleId == battleId, ct)
            ?? throw new DomainException(DomainMessages.CombatantNotFound, StatusCodes.Status404NotFound);

        if (combatant.CurrentHp > BattleRules.MinHp)
        {
            throw new DomainException(DomainMessages.KillOnlyAtZeroHp);
        }

        combatant.IsDead = true;
        await _db.SaveChangesAsync(ct);

        return await BuildAndNotifyAsync(battleId, ct: ct);
    }

    public async Task<BattleSnapshotDto> ReviveAsync(Guid campaignId, ReviveRequest request, CancellationToken ct = default)
    {
        var battleId = await FindOpenBattleIdAsync(campaignId, ct)
            ?? throw new DomainException(DomainMessages.BattleNotFound);

        var combatant = await _db.Combatants
            .FirstOrDefaultAsync(c => c.Id == request.CombatantId && c.BattleId == battleId, ct)
            ?? throw new DomainException(DomainMessages.CombatantNotFound, StatusCodes.Status404NotFound);

        if (!combatant.IsDead)
        {
            throw new DomainException(DomainMessages.CombatantNotDead);
        }

        if (combatant.CurrentHp <= BattleRules.MinHp)
        {
            if (!request.HealAmount.HasValue || request.HealAmount.Value <= 0)
            {
                throw new DomainException(DomainMessages.ReviveRequiresHeal);
            }

            combatant.CurrentHp = Math.Min(combatant.MaxHp, request.HealAmount.Value);
        }

        combatant.IsDead = false;
        await SyncSkipTurnFlagAsync(combatant.Id, ct);
        await _db.SaveChangesAsync(ct);

        return await BuildAndNotifyAsync(battleId, ct: ct);
    }

    public async Task<BattleSnapshotDto> ApplyModifierAsync(Guid campaignId, ApplyModifierRequest request, CancellationToken ct = default)
    {
        var battleId = await FindOpenBattleIdAsync(campaignId, ct)
            ?? throw new DomainException(DomainMessages.BattleNotFound);

        var combatant = await _db.Combatants
            .FirstOrDefaultAsync(c => c.Id == request.CombatantId && c.BattleId == battleId, ct)
            ?? throw new DomainException(DomainMessages.CombatantNotFound, StatusCodes.Status404NotFound);

        var type = await _db.ModifierTypes.FirstOrDefaultAsync(t => t.Id == request.ModifierTypeId, ct)
            ?? throw new DomainException(DomainMessages.ModifierTypeNotFound, StatusCodes.Status404NotFound);

        var duration = request.Duration ?? type.DefaultDuration;
        if (duration < 1)
        {
            throw new DomainException(DomainMessages.DurationMustBePositive);
        }

        int? resolvedDamage = null;
        if (type.DamageMode == DamageMode.DiceOnce)
        {
            resolvedDamage = _diceService.Roll(type.DamageDice!);
        }

        int? resolvedHeal = null;
        if (type.HealMode == DamageMode.DiceOnce)
        {
            resolvedHeal = _diceService.Roll(type.HealDice!);
        }

        _db.ActiveModifiers.Add(new ActiveModifier
        {
            Id = Guid.NewGuid(),
            CombatantId = combatant.Id,
            ModifierTypeId = type.Id,
            Name = type.Name,
            RemainingDuration = duration,
            SkipsTurn = type.SkipsTurn,
            IconKey = type.IconKey,
            IconUrl = type.IconUrl,
            AcDelta = type.AcDelta,
            DamageMode = type.DamageMode,
            DamageAmount = type.DamageAmount,
            DamageDice = type.DamageDice,
            ResolvedDamage = resolvedDamage,
            LastTickDamage = null,
            HealMode = type.HealMode,
            HealAmount = type.HealAmount,
            HealDice = type.HealDice,
            ResolvedHeal = resolvedHeal,
            LastTickHeal = null
        });

        if (type.SkipsTurn)
        {
            combatant.HasSkipTurnEffectActive = true;
        }

        await _db.SaveChangesAsync(ct);
        await RecalcAcForCombatantAsync(combatant.Id, ct);
        await _db.SaveChangesAsync(ct);
        return await BuildAndNotifyAsync(battleId, ct: ct);
    }

    public async Task<BattleSnapshotDto> RemoveModifierAsync(Guid campaignId, Guid activeModifierId, CancellationToken ct = default)
    {
        var battleId = await FindOpenBattleIdAsync(campaignId, ct)
            ?? throw new DomainException(DomainMessages.BattleNotFound);

        var modifier = await _db.ActiveModifiers
            .Include(m => m.Combatant)
            .FirstOrDefaultAsync(m => m.Id == activeModifierId && m.Combatant.BattleId == battleId, ct)
            ?? throw new DomainException(DomainMessages.ActiveModifierNotFound, StatusCodes.Status404NotFound);

        var combatantId = modifier.CombatantId;
        _db.ActiveModifiers.Remove(modifier);
        await _db.SaveChangesAsync(ct);
        await SyncSkipTurnFlagAsync(combatantId, ct);
        await RecalcAcForCombatantAsync(combatantId, ct);
        await _db.SaveChangesAsync(ct);

        return await BuildAndNotifyAsync(battleId, ct: ct);
    }

    private async Task<IReadOnlyList<ModifierTickEventDto>> ResolveDamageTicksForCurrentAsync(
        Battle battle,
        IReadOnlyList<Combatant> ordered,
        CancellationToken ct)
    {
        if (battle.CurrentTurnIndex < 0 || battle.CurrentTurnIndex >= ordered.Count)
        {
            return Array.Empty<ModifierTickEventDto>();
        }

        var current = ordered[battle.CurrentTurnIndex];
        if (current.IsDead)
        {
            return Array.Empty<ModifierTickEventDto>();
        }

        await _db.Entry(current).Collection(c => c.ActiveModifiers).LoadAsync(ct);
        await _db.Entry(current).Reference(c => c.Sheet).LoadAsync(ct);

        var events = new List<ModifierTickEventDto>();
        foreach (var modifier in current.ActiveModifiers.Where(m => m.RemainingDuration > 0).ToList())
        {
            var damage = ResolveTickAmount(
                modifier.DamageMode,
                modifier.DamageAmount,
                modifier.DamageDice,
                modifier.ResolvedDamage);
            if (damage is > 0)
            {
                current.CurrentHp = Math.Max(BattleRules.MinHp, current.CurrentHp - damage.Value);
                modifier.LastTickDamage = damage.Value;
                events.Add(new ModifierTickEventDto(
                    current.Id,
                    current.Sheet.Name,
                    modifier.Id,
                    modifier.Name,
                    damage.Value,
                    "Damage",
                    modifier.DamageMode == DamageMode.DicePerTurn ? modifier.DamageDice : null));
            }

            var heal = ResolveTickAmount(
                modifier.HealMode,
                modifier.HealAmount,
                modifier.HealDice,
                modifier.ResolvedHeal);
            if (heal is > 0)
            {
                current.CurrentHp = Math.Min(current.MaxHp, current.CurrentHp + heal.Value);
                modifier.LastTickHeal = heal.Value;
                events.Add(new ModifierTickEventDto(
                    current.Id,
                    current.Sheet.Name,
                    modifier.Id,
                    modifier.Name,
                    heal.Value,
                    "Heal",
                    modifier.HealMode == DamageMode.DicePerTurn ? modifier.HealDice : null));
            }
        }

        return events;
    }

    private int? ResolveTickAmount(
        DamageMode mode,
        int? fixedAmount,
        string? dice,
        int? resolvedOnce) =>
        mode switch
        {
            DamageMode.Fixed => fixedAmount,
            DamageMode.DicePerTurn => string.IsNullOrWhiteSpace(dice)
                ? null
                : _diceService.Roll(dice),
            DamageMode.DiceOnce => resolvedOnce,
            _ => null
        };

    private async Task RecalcAcForBattleAsync(Guid battleId, CancellationToken ct)
    {
        var combatants = await _db.Combatants
            .Include(c => c.ActiveModifiers)
            .Where(c => c.BattleId == battleId)
            .ToListAsync(ct);

        foreach (var combatant in combatants)
        {
            ApplyAc(combatant);
        }
    }

    private async Task RecalcAcForCombatantAsync(Guid combatantId, CancellationToken ct)
    {
        var combatant = await _db.Combatants
            .Include(c => c.ActiveModifiers)
            .FirstAsync(c => c.Id == combatantId, ct);
        ApplyAc(combatant);
    }

    private static void ApplyAc(Combatant combatant)
    {
        var delta = combatant.ActiveModifiers
            .Where(m => m.RemainingDuration > 0)
            .Sum(m => m.AcDelta);
        combatant.CurrentAc = combatant.BaseAc + delta;
    }

    private async Task DecrementModifiersForBattleAsync(Guid battleId, CancellationToken ct)
    {
        var modifiers = await _db.ActiveModifiers
            .Where(m => m.Combatant.BattleId == battleId)
            .ToListAsync(ct);

        foreach (var modifier in modifiers)
        {
            modifier.RemainingDuration -= 1;
        }

        var expired = modifiers.Where(m => m.RemainingDuration <= 0).ToList();
        if (expired.Count > 0)
        {
            _db.ActiveModifiers.RemoveRange(expired);
        }
    }

    private async Task RearmSkipTurnFlagsAsync(Guid battleId, CancellationToken ct)
    {
        var combatants = await _db.Combatants
            .Include(c => c.ActiveModifiers)
            .Where(c => c.BattleId == battleId)
            .ToListAsync(ct);

        foreach (var combatant in combatants)
        {
            combatant.HasSkipTurnEffectActive = combatant.ActiveModifiers
                .Any(m => m.SkipsTurn && m.RemainingDuration > 0);
        }
    }

    private async Task SyncSkipTurnFlagAsync(Guid combatantId, CancellationToken ct)
    {
        var combatant = await _db.Combatants
            .Include(c => c.ActiveModifiers)
            .FirstAsync(c => c.Id == combatantId, ct);

        combatant.HasSkipTurnEffectActive = combatant.ActiveModifiers
            .Any(m => m.SkipsTurn && m.RemainingDuration > 0);
    }

    private async Task<Guid?> FindOpenBattleIdAsync(Guid campaignId, CancellationToken ct)
    {
        return await _db.Battles
            .AsNoTracking()
            .Where(b =>
                b.CampaignId == campaignId &&
                (b.Status == BattleStatus.Preparing || b.Status == BattleStatus.Active))
            .OrderByDescending(b => b.CreatedAtUtc)
            .Select(b => (Guid?)b.Id)
            .FirstOrDefaultAsync(ct);
    }

    private async Task<Battle?> LoadTrackedBattleAsync(Guid campaignId, CancellationToken ct)
    {
        return await _db.Battles
            .Where(b =>
                b.CampaignId == campaignId &&
                (b.Status == BattleStatus.Preparing || b.Status == BattleStatus.Active))
            .OrderByDescending(b => b.CreatedAtUtc)
            .FirstOrDefaultAsync(ct);
    }

    private async Task<Guid> EnsureOpenBattleIdAsync(Guid campaignId, CancellationToken ct)
    {
        var existing = await FindOpenBattleIdAsync(campaignId, ct);
        if (existing is not null)
        {
            return existing.Value;
        }

        var campaignExists = await _db.Campaigns.AnyAsync(c => c.Id == campaignId, ct);
        if (!campaignExists)
        {
            throw new DomainException(DomainMessages.CampaignNotFound, StatusCodes.Status404NotFound);
        }

        var battle = new Battle
        {
            Id = Guid.NewGuid(),
            CampaignId = campaignId,
            Status = BattleStatus.Preparing,
            CurrentTurnIndex = 0,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.Battles.Add(battle);
        await _db.SaveChangesAsync(ct);
        return battle.Id;
    }

    private async Task<string> GetCampaignPublicTokenAsync(Guid campaignId, CancellationToken ct)
    {
        return await _db.Campaigns
            .AsNoTracking()
            .Where(c => c.Id == campaignId)
            .Select(c => c.PublicToken)
            .FirstAsync(ct);
    }

    private async Task InsertCombatantAsync(
        Guid battleId,
        Sheet sheet,
        int initiative,
        bool hideHpFromPublic,
        CancellationToken ct)
    {
        _db.Combatants.Add(new Combatant
        {
            Id = Guid.NewGuid(),
            BattleId = battleId,
            SheetId = sheet.Id,
            Initiative = initiative,
            CurrentHp = sheet.CurrentHp,
            MaxHp = sheet.MaxHp,
            BaseAc = sheet.BaseAc,
            CurrentAc = sheet.BaseAc,
            IsDead = false,
            HideHpFromPublic = hideHpFromPublic,
            HasSkipTurnEffectActive = false,
            SortOrder = 0
        });
        await _db.SaveChangesAsync(ct);
    }

    private async Task ReorderAsync(Guid battleId, CancellationToken ct)
    {
        var combatants = await _db.Combatants
            .Where(c => c.BattleId == battleId)
            .Include(c => c.Sheet)
            .ToListAsync(ct);

        var ordered = combatants
            .OrderByDescending(c => c.Initiative)
            .ThenByDescending(c => c.Sheet.DexModifier)
            .ThenBy(c => c.Id)
            .ToList();

        for (var i = 0; i < ordered.Count; i++)
        {
            ordered[i].SortOrder = i;
        }

        await _db.SaveChangesAsync(ct);
    }

    private static int FindNextEligibleIndex(IReadOnlyList<Combatant> ordered, int fromIndex)
    {
        if (ordered.Count == 0)
        {
            return 0;
        }

        for (var step = 1; step <= ordered.Count; step++)
        {
            var idx = (fromIndex + step + ordered.Count) % ordered.Count;
            var c = ordered[idx];
            if (!c.IsDead && !c.HasSkipTurnEffectActive)
            {
                return idx;
            }
        }

        return Math.Max(0, fromIndex);
    }

    private static bool DidCompleteRound(int previousIndex, int nextIndex, int count)
    {
        if (count == 0)
        {
            return false;
        }

        return nextIndex <= previousIndex && previousIndex >= 0;
    }

    private static void ConsumeSkipTurnBetween(IReadOnlyList<Combatant> ordered, int fromIndex, int toIndex)
    {
        if (ordered.Count == 0)
        {
            return;
        }

        var idx = fromIndex;
        for (var step = 1; step <= ordered.Count; step++)
        {
            idx = (idx + 1) % ordered.Count;
            if (idx == toIndex)
            {
                break;
            }

            var skipped = ordered[idx];
            if (!skipped.IsDead && skipped.HasSkipTurnEffectActive)
            {
                skipped.HasSkipTurnEffectActive = false;
            }
        }
    }

    private async Task<BattleSnapshotDto> BuildAndNotifyAsync(
        Guid battleId,
        int? lastDiceRoll = null,
        IReadOnlyList<ModifierTickEventDto>? lastTickEvents = null,
        CancellationToken ct = default)
    {
        var snapshot = await BuildSnapshotAsync(
            battleId,
            lastDiceRoll,
            lastTickEvents,
            forPublic: false,
            ct: ct);

        var battle = await _db.Battles
            .AsNoTracking()
            .Include(b => b.Campaign)
            .FirstAsync(b => b.Id == battleId, ct);
        await _notifier.NotifyBattleUpdatedAsync(battle.Campaign.PublicToken, ct: ct);
        return snapshot;
    }

    private async Task<BattleSnapshotDto> BuildSnapshotAsync(
        Guid battleId,
        int? lastDiceRoll = null,
        IReadOnlyList<ModifierTickEventDto>? lastTickEvents = null,
        bool forPublic = false,
        CancellationToken ct = default)
    {
        var battle = await _db.Battles
            .AsNoTracking()
            .Include(b => b.Campaign)
            .FirstAsync(b => b.Id == battleId, ct);

        var ordered = await _db.Combatants
            .AsNoTracking()
            .Include(c => c.Sheet)
            .Include(c => c.ActiveModifiers)
            .Where(c => c.BattleId == battleId)
            .OrderBy(c => c.SortOrder)
            .ToListAsync(ct);

        var combatants = ordered.Select((c, index) =>
        {
            var hideHp = forPublic && c.HideHpFromPublic;
            return new CombatantDto(
                c.Id,
                c.SheetId,
                c.Sheet.Name,
                c.Sheet.ImageUrl,
                c.Sheet.ImageFocusX,
                c.Sheet.ImageFocusY,
                c.Sheet.Type.ToString(),
                c.Initiative,
                hideHp ? 0 : c.CurrentHp,
                hideHp ? 0 : c.MaxHp,
                c.CurrentAc,
                c.IsDead,
                c.SortOrder,
                battle.Status == BattleStatus.Active && index == battle.CurrentTurnIndex && !c.IsDead,
                c.HideHpFromPublic,
                c.ActiveModifiers
                    .OrderBy(m => m.Name)
                    .Select(MapActiveModifier)
                    .ToList());
        }).ToList();

        return new BattleSnapshotDto(
            battle.Id,
            battle.Campaign.PublicToken,
            battle.Status.ToString(),
            battle.CurrentTurnIndex,
            combatants,
            null,
            lastDiceRoll,
            lastTickEvents,
            CanSavePlayerStats: false);
    }

    private static ActiveModifierDto MapActiveModifier(ActiveModifier m) =>
        new(
            m.Id,
            m.Name,
            m.RemainingDuration,
            m.SkipsTurn,
            m.IconKey,
            m.IconUrl,
            m.AcDelta,
            m.DamageMode.ToString(),
            m.DamageAmount,
            m.DamageDice,
            m.ResolvedDamage,
            m.LastTickDamage,
            m.HealMode.ToString(),
            m.HealAmount,
            m.HealDice,
            m.ResolvedHeal,
            m.LastTickHeal);

    private static BattleSnapshotDto EmptySnapshot(
        string message,
        string? token = null,
        bool canSavePlayerStats = false) =>
        new(
            null,
            token,
            BattleStatus.Finished.ToString(),
            0,
            Array.Empty<CombatantDto>(),
            message,
            null,
            null,
            canSavePlayerStats);

    public async Task<CombatantTacticalDto> GetCombatantTacticalAsync(
        Guid campaignId,
        Guid combatantId,
        CancellationToken ct = default)
    {
        var battleId = await FindOpenBattleIdAsync(campaignId, ct)
            ?? throw new DomainException(DomainMessages.BattleNotFound);

        var combatant = await _db.Combatants
            .AsNoTracking()
            .Include(c => c.Sheet)
                .ThenInclude(s => s.Attacks)
            .Include(c => c.Sheet)
                .ThenInclude(s => s.Spells)
            .Include(c => c.Sheet)
                .ThenInclude(s => s.Weapons)
            .FirstOrDefaultAsync(c => c.Id == combatantId && c.BattleId == battleId, ct)
            ?? throw new DomainException(DomainMessages.CombatantNotFound, StatusCodes.Status404NotFound);

        var sheet = combatant.Sheet;
        return new CombatantTacticalDto(
            combatant.Id,
            sheet.Id,
            sheet.Name,
            sheet.Type.ToString(),
            sheet.Class.ToString(),
            sheet.Strength,
            AbilityScores.Modifier(sheet.Strength),
            sheet.Dexterity,
            AbilityScores.Modifier(sheet.Dexterity),
            sheet.Constitution,
            AbilityScores.Modifier(sheet.Constitution),
            sheet.Intelligence,
            AbilityScores.Modifier(sheet.Intelligence),
            sheet.Wisdom,
            AbilityScores.Modifier(sheet.Wisdom),
            sheet.Charisma,
            AbilityScores.Modifier(sheet.Charisma),
            sheet.Resistances,
            sheet.Attacks.OrderBy(a => a.SortOrder).Select(SheetService.MapAttack).ToList(),
            sheet.Spells.OrderBy(s => s.SortOrder).Select(SheetService.MapSpell).ToList(),
            sheet.Weapons.OrderBy(w => w.SortOrder).Select(SheetService.MapWeapon).ToList());
    }
}
