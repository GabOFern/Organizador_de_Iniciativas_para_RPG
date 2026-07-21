using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Services;

public interface IModifierTypeService
{
    Task<IReadOnlyList<ModifierTypeDto>> ListAsync(CancellationToken ct = default);
    Task<ModifierTypeDto> CreateAsync(CreateModifierTypeRequest request, CancellationToken ct = default);
    Task<ModifierTypeDto> UpdateAsync(Guid id, UpdateModifierTypeRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public class ModifierTypeService : IModifierTypeService
{
    private readonly AppDbContext _db;
    private readonly IDiceService _diceService;

    public ModifierTypeService(AppDbContext db, IDiceService diceService)
    {
        _db = db;
        _diceService = diceService;
    }

    public async Task<IReadOnlyList<ModifierTypeDto>> ListAsync(CancellationToken ct = default)
    {
        var items = await _db.ModifierTypes
            .OrderBy(t => t.Name)
            .ToListAsync(ct);
        return items.Select(Map).ToList();
    }

    public async Task<ModifierTypeDto> CreateAsync(CreateModifierTypeRequest request, CancellationToken ct = default)
    {
        var normalized = ValidateAndNormalize(request);

        var entity = new ModifierType
        {
            Id = Guid.NewGuid(),
            Name = normalized.Name,
            DefaultDuration = normalized.DefaultDuration,
            SkipsTurn = request.SkipsTurn,
            IconKey = normalized.IconKey,
            IconUrl = normalized.IconUrl,
            AcDelta = normalized.AcDelta,
            DamageMode = normalized.DamageMode,
            DamageAmount = normalized.DamageAmount,
            DamageDice = normalized.DamageDice,
            HealMode = normalized.HealMode,
            HealAmount = normalized.HealAmount,
            HealDice = normalized.HealDice
        };
        _db.ModifierTypes.Add(entity);
        await _db.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task<ModifierTypeDto> UpdateAsync(Guid id, UpdateModifierTypeRequest request, CancellationToken ct = default)
    {
        var normalized = ValidateAndNormalize(request);

        var entity = await _db.ModifierTypes.FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new DomainException(DomainMessages.ModifierTypeNotFound, StatusCodes.Status404NotFound);

        entity.Name = normalized.Name;
        entity.DefaultDuration = normalized.DefaultDuration;
        entity.SkipsTurn = request.SkipsTurn;
        entity.IconKey = normalized.IconKey;
        entity.IconUrl = normalized.IconUrl;
        entity.AcDelta = normalized.AcDelta;
        entity.DamageMode = normalized.DamageMode;
        entity.DamageAmount = normalized.DamageAmount;
        entity.DamageDice = normalized.DamageDice;
        entity.HealMode = normalized.HealMode;
        entity.HealAmount = normalized.HealAmount;
        entity.HealDice = normalized.HealDice;
        await _db.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.ModifierTypes.FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new DomainException(DomainMessages.ModifierTypeNotFound, StatusCodes.Status404NotFound);

        _db.ModifierTypes.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }

    private NormalizedModifierType ValidateAndNormalize(CreateModifierTypeRequest request) =>
        ValidateAndNormalize(
            request.Name,
            request.DefaultDuration,
            request.IconKey,
            request.IconUrl,
            request.AcDelta,
            request.DamageMode,
            request.DamageAmount,
            request.DamageDice,
            request.HealMode,
            request.HealAmount,
            request.HealDice);

    private NormalizedModifierType ValidateAndNormalize(UpdateModifierTypeRequest request) =>
        ValidateAndNormalize(
            request.Name,
            request.DefaultDuration,
            request.IconKey,
            request.IconUrl,
            request.AcDelta,
            request.DamageMode,
            request.DamageAmount,
            request.DamageDice,
            request.HealMode,
            request.HealAmount,
            request.HealDice);

    private NormalizedModifierType ValidateAndNormalize(
        string name,
        int defaultDuration,
        string iconKey,
        string? iconUrl,
        int acDelta,
        DamageMode damageMode,
        int? damageAmount,
        string? damageDice,
        DamageMode healMode,
        int? healAmount,
        string? healDice)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException(DomainMessages.NameRequired);
        }

        if (defaultDuration < 1)
        {
            throw new DomainException(DomainMessages.DurationMustBePositive);
        }

        var key = string.IsNullOrWhiteSpace(iconKey) ? ModifierIconKeys.Default : iconKey.Trim();
        if (!ModifierIconKeys.IsAllowed(key))
        {
            throw new DomainException(DomainMessages.InvalidModifierIcon);
        }

        var url = string.IsNullOrWhiteSpace(iconUrl) ? null : iconUrl.Trim();
        var (dmgAmount, dmgDice) = NormalizeAmountMode(
            damageMode,
            damageAmount,
            damageDice,
            DomainMessages.DamageAmountRequired,
            DomainMessages.DamageDiceRequired);
        var (hlAmount, hlDice) = NormalizeAmountMode(
            healMode,
            healAmount,
            healDice,
            DomainMessages.HealAmountRequired,
            DomainMessages.HealDiceRequired);

        return new NormalizedModifierType(
            name.Trim(),
            defaultDuration,
            key.ToLowerInvariant(),
            url,
            acDelta,
            damageMode,
            dmgAmount,
            dmgDice,
            healMode,
            hlAmount,
            hlDice);
    }

    private (int? Amount, string? Dice) NormalizeAmountMode(
        DamageMode mode,
        int? amount,
        string? dice,
        string amountRequiredMessage,
        string diceRequiredMessage)
    {
        switch (mode)
        {
            case DamageMode.None:
                return (null, null);
            case DamageMode.Fixed:
                if (!amount.HasValue || amount.Value <= 0)
                {
                    throw new DomainException(amountRequiredMessage);
                }

                return (amount.Value, null);
            case DamageMode.DicePerTurn:
            case DamageMode.DiceOnce:
                if (string.IsNullOrWhiteSpace(dice) || !_diceService.IsValidNotation(dice))
                {
                    throw new DomainException(diceRequiredMessage);
                }

                return (null, dice.Trim());
            default:
                throw new DomainException(DomainMessages.InvalidDiceNotation);
        }
    }

    private static ModifierTypeDto Map(ModifierType t) =>
        new(
            t.Id,
            t.Name,
            t.DefaultDuration,
            t.SkipsTurn,
            t.IconKey,
            t.IconUrl,
            t.AcDelta,
            t.DamageMode.ToString(),
            t.DamageAmount,
            t.DamageDice,
            t.HealMode.ToString(),
            t.HealAmount,
            t.HealDice);

    private sealed record NormalizedModifierType(
        string Name,
        int DefaultDuration,
        string IconKey,
        string? IconUrl,
        int AcDelta,
        DamageMode DamageMode,
        int? DamageAmount,
        string? DamageDice,
        DamageMode HealMode,
        int? HealAmount,
        string? HealDice);
}
