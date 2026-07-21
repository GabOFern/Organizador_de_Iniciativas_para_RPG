using System.Security.Cryptography;
using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Services;

public interface IBattleService
{
    Task<BattleSnapshotDto> GetCurrentAsync(CancellationToken ct = default);
    Task<BattleSnapshotDto> GetByPublicTokenAsync(string token, CancellationToken ct = default);
    Task<BattleSnapshotDto> InvokePlayerAsync(InvokePlayerRequest request, CancellationToken ct = default);
    Task<BattleSnapshotDto> InvokeCreatureAsync(InvokeCreatureRequest request, CancellationToken ct = default);
    Task<BattleSnapshotDto> StartAsync(CancellationToken ct = default);
    Task<BattleSnapshotDto> NextAsync(CancellationToken ct = default);
    Task<BattleSnapshotDto> FinishAsync(CancellationToken ct = default);
    Task<BattleSnapshotDto> ApplyDamageAsync(DamageRequest request, CancellationToken ct = default);
    Task<BattleSnapshotDto> KillAsync(KillRequest request, CancellationToken ct = default);
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

    public async Task<BattleSnapshotDto> GetCurrentAsync(CancellationToken ct = default)
    {
        var battleId = await FindOpenBattleIdAsync(ct);
        if (battleId is null)
        {
            return EmptySnapshot(DomainMessages.NoPublicBattle);
        }

        return await BuildSnapshotAsync(battleId.Value, ct: ct);
    }

    public async Task<BattleSnapshotDto> GetByPublicTokenAsync(string token, CancellationToken ct = default)
    {
        var battle = await _db.Battles
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.PublicToken == token, ct);

        if (battle is null || battle.Status == BattleStatus.Finished)
        {
            return EmptySnapshot(DomainMessages.NoPublicBattle);
        }

        return await BuildSnapshotAsync(battle.Id, ct: ct);
    }

    public async Task<BattleSnapshotDto> InvokePlayerAsync(InvokePlayerRequest request, CancellationToken ct = default)
    {
        var sheet = await _db.Sheets.AsNoTracking().FirstOrDefaultAsync(s => s.Id == request.SheetId, ct)
            ?? throw new DomainException(DomainMessages.SheetNotFound, StatusCodes.Status404NotFound);

        if (sheet.Type != SheetType.Player)
        {
            throw new DomainException(DomainMessages.SheetMustBePlayer);
        }

        var battleId = await EnsureOpenBattleIdAsync(ct);

        var alreadyIn = await _db.Combatants.AnyAsync(
            c => c.BattleId == battleId && c.SheetId == sheet.Id,
            ct);

        if (alreadyIn && !request.ConfirmDuplicate)
        {
            throw new DomainException(DomainMessages.PlayerAlreadyInBattle, StatusCodes.Status409Conflict);
        }

        await InsertCombatantAsync(battleId, sheet, request.Initiative, ct);
        await ReorderAsync(battleId, ct);

        return await BuildAndNotifyAsync(battleId, ct: ct);
    }

    public async Task<BattleSnapshotDto> InvokeCreatureAsync(InvokeCreatureRequest request, CancellationToken ct = default)
    {
        var sheet = await _db.Sheets.AsNoTracking().FirstOrDefaultAsync(s => s.Id == request.SheetId, ct)
            ?? throw new DomainException(DomainMessages.SheetNotFound, StatusCodes.Status404NotFound);

        if (sheet.Type != SheetType.Creature)
        {
            throw new DomainException(DomainMessages.SheetMustBeCreature);
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

        var battleId = await EnsureOpenBattleIdAsync(ct);
        await InsertCombatantAsync(battleId, sheet, initiative, ct);
        await ReorderAsync(battleId, ct);

        return await BuildAndNotifyAsync(battleId, lastDiceRoll: diceRoll, ct: ct);
    }

    public async Task<BattleSnapshotDto> StartAsync(CancellationToken ct = default)
    {
        var battle = await LoadTrackedBattleAsync(ct)
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

        return await BuildAndNotifyAsync(battle.Id, ct: ct);
    }

    public async Task<BattleSnapshotDto> NextAsync(CancellationToken ct = default)
    {
        var battle = await LoadTrackedBattleAsync(ct)
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

        var nextIndex = FindNextEligibleIndex(ordered, battle.CurrentTurnIndex);
        _ = DidCompleteRound(battle.CurrentTurnIndex, nextIndex, ordered.Count);
        ConsumeSkipTurnBetween(ordered, battle.CurrentTurnIndex, nextIndex);

        battle.CurrentTurnIndex = nextIndex;
        await _db.SaveChangesAsync(ct);

        return await BuildAndNotifyAsync(battle.Id, ct: ct);
    }

    public async Task<BattleSnapshotDto> FinishAsync(CancellationToken ct = default)
    {
        var battle = await LoadTrackedBattleAsync(ct)
            ?? throw new DomainException(DomainMessages.BattleNotFound);

        if (battle.Status == BattleStatus.Finished)
        {
            throw new DomainException(DomainMessages.BattleNotActive);
        }

        var token = battle.PublicToken;
        battle.Status = BattleStatus.Finished;
        await _db.SaveChangesAsync(ct);

        var snapshot = EmptySnapshot(DomainMessages.NoPublicBattle, token);
        await _notifier.NotifyBattleUpdatedAsync(snapshot, ct);
        return snapshot;
    }

    public async Task<BattleSnapshotDto> ApplyDamageAsync(DamageRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
        {
            throw new DomainException(DomainMessages.DamageMustBePositive);
        }

        var battleId = await FindOpenBattleIdAsync(ct)
            ?? throw new DomainException(DomainMessages.BattleNotFound);

        var combatant = await _db.Combatants
            .FirstOrDefaultAsync(c => c.Id == request.CombatantId && c.BattleId == battleId, ct)
            ?? throw new DomainException(DomainMessages.CombatantNotFound, StatusCodes.Status404NotFound);

        combatant.CurrentHp = Math.Max(BattleRules.MinHp, combatant.CurrentHp - request.Amount);
        await _db.SaveChangesAsync(ct);

        return await BuildAndNotifyAsync(battleId, ct: ct);
    }

    public async Task<BattleSnapshotDto> KillAsync(KillRequest request, CancellationToken ct = default)
    {
        var battleId = await FindOpenBattleIdAsync(ct)
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

    private async Task<Guid?> FindOpenBattleIdAsync(CancellationToken ct)
    {
        return await _db.Battles
            .AsNoTracking()
            .Where(b => b.Status == BattleStatus.Preparing || b.Status == BattleStatus.Active)
            .OrderByDescending(b => b.CreatedAtUtc)
            .Select(b => (Guid?)b.Id)
            .FirstOrDefaultAsync(ct);
    }

    private async Task<Battle?> LoadTrackedBattleAsync(CancellationToken ct)
    {
        return await _db.Battles
            .Where(b => b.Status == BattleStatus.Preparing || b.Status == BattleStatus.Active)
            .OrderByDescending(b => b.CreatedAtUtc)
            .FirstOrDefaultAsync(ct);
    }

    private async Task<Guid> EnsureOpenBattleIdAsync(CancellationToken ct)
    {
        var existing = await FindOpenBattleIdAsync(ct);
        if (existing is not null)
        {
            return existing.Value;
        }

        var battle = new Battle
        {
            Id = Guid.NewGuid(),
            PublicToken = GeneratePublicToken(),
            Status = BattleStatus.Preparing,
            CurrentTurnIndex = 0,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.Battles.Add(battle);
        await _db.SaveChangesAsync(ct);
        return battle.Id;
    }

    private async Task InsertCombatantAsync(Guid battleId, Sheet sheet, int initiative, CancellationToken ct)
    {
        _db.Combatants.Add(new Combatant
        {
            Id = Guid.NewGuid(),
            BattleId = battleId,
            SheetId = sheet.Id,
            Initiative = initiative,
            CurrentHp = sheet.CurrentHp,
            MaxHp = sheet.MaxHp,
            CurrentAc = sheet.BaseAc,
            IsDead = false,
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
        CancellationToken ct = default)
    {
        var snapshot = await BuildSnapshotAsync(battleId, lastDiceRoll, ct);
        await _notifier.NotifyBattleUpdatedAsync(snapshot, ct);
        return snapshot;
    }

    private async Task<BattleSnapshotDto> BuildSnapshotAsync(
        Guid battleId,
        int? lastDiceRoll = null,
        CancellationToken ct = default)
    {
        var battle = await _db.Battles
            .AsNoTracking()
            .FirstAsync(b => b.Id == battleId, ct);

        var ordered = await _db.Combatants
            .AsNoTracking()
            .Include(c => c.Sheet)
            .Where(c => c.BattleId == battleId)
            .OrderBy(c => c.SortOrder)
            .ToListAsync(ct);

        var combatants = ordered.Select((c, index) => new CombatantDto(
            c.Id,
            c.SheetId,
            c.Sheet.Name,
            c.Sheet.ImageUrl,
            c.Sheet.Type.ToString(),
            c.Initiative,
            c.CurrentHp,
            c.MaxHp,
            c.CurrentAc,
            c.IsDead,
            c.SortOrder,
            battle.Status == BattleStatus.Active && index == battle.CurrentTurnIndex && !c.IsDead
        )).ToList();

        return new BattleSnapshotDto(
            battle.Id,
            battle.PublicToken,
            battle.Status.ToString(),
            battle.CurrentTurnIndex,
            combatants,
            null,
            lastDiceRoll);
    }

    private static BattleSnapshotDto EmptySnapshot(string message, string? token = null) =>
        new(null, token, BattleStatus.Finished.ToString(), 0, Array.Empty<CombatantDto>(), message, null);

    private static string GeneratePublicToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(BattleRules.PublicTokenLength);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
