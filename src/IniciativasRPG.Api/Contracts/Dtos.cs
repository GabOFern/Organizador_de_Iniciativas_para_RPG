using IniciativasRPG.Api.Domain;

namespace IniciativasRPG.Api.Contracts;

public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, string Username);

public record SheetDto(
    Guid Id,
    string Name,
    string? ImageUrl,
    string Type,
    int MaxHp,
    int CurrentHp,
    int BaseAc,
    int DexModifier);

public record CreateSheetRequest(
    string Name,
    string? ImageUrl,
    SheetType Type,
    int MaxHp,
    int BaseAc,
    int DexModifier);

public record UpdateSheetRequest(
    string Name,
    string? ImageUrl,
    SheetType Type,
    int MaxHp,
    int CurrentHp,
    int BaseAc,
    int DexModifier);

public record ActiveModifierDto(
    Guid Id,
    string Name,
    int RemainingDuration,
    bool SkipsTurn,
    string IconKey,
    string? IconUrl,
    int AcDelta,
    string DamageMode,
    int? DamageAmount,
    string? DamageDice,
    int? ResolvedDamage,
    int? LastTickDamage,
    string HealMode,
    int? HealAmount,
    string? HealDice,
    int? ResolvedHeal,
    int? LastTickHeal);

public record ModifierTickEventDto(
    Guid CombatantId,
    string CombatantName,
    Guid ModifierId,
    string ModifierName,
    int Amount,
    string Kind,
    string? RollDetail);

public record CombatantDto(
    Guid Id,
    Guid SheetId,
    string Name,
    string? ImageUrl,
    string SheetType,
    int Initiative,
    int CurrentHp,
    int MaxHp,
    int CurrentAc,
    bool IsDead,
    int SortOrder,
    bool IsCurrentTurn,
    bool HideHpFromPublic,
    IReadOnlyList<ActiveModifierDto> Modifiers);

public record BattleSnapshotDto(
    Guid? Id,
    string? PublicToken,
    string Status,
    int CurrentTurnIndex,
    IReadOnlyList<CombatantDto> Combatants,
    string? Message,
    int? LastDiceRoll,
    IReadOnlyList<ModifierTickEventDto>? LastTickEvents = null,
    bool CanSavePlayerStats = false);

public record PublicBattleSummaryDto(
    string PublicToken,
    string Status,
    int CombatantCount,
    IReadOnlyList<string> CombatantNames,
    DateTime CreatedAtUtc);

public record InvokePlayerRequest(Guid SheetId, int Initiative, bool ConfirmDuplicate = false);
public record InvokeCreatureRequest(
    Guid SheetId,
    int? Initiative,
    bool RollDice,
    string? DiceNotation,
    bool HideHpFromPublic = true);
public record DamageRequest(Guid CombatantId, int Amount);
public record HealRequest(Guid CombatantId, int Amount);
public record KillRequest(Guid CombatantId);
public record ReviveRequest(Guid CombatantId, int? HealAmount);

public record ModifierTypeDto(
    Guid Id,
    string Name,
    int DefaultDuration,
    bool SkipsTurn,
    string IconKey,
    string? IconUrl,
    int AcDelta,
    string DamageMode,
    int? DamageAmount,
    string? DamageDice,
    string HealMode,
    int? HealAmount,
    string? HealDice);

public record CreateModifierTypeRequest(
    string Name,
    int DefaultDuration,
    bool SkipsTurn,
    string IconKey,
    string? IconUrl,
    int AcDelta,
    DamageMode DamageMode,
    int? DamageAmount,
    string? DamageDice,
    DamageMode HealMode = DamageMode.None,
    int? HealAmount = null,
    string? HealDice = null);

public record UpdateModifierTypeRequest(
    string Name,
    int DefaultDuration,
    bool SkipsTurn,
    string IconKey,
    string? IconUrl,
    int AcDelta,
    DamageMode DamageMode,
    int? DamageAmount,
    string? DamageDice,
    DamageMode HealMode = DamageMode.None,
    int? HealAmount = null,
    string? HealDice = null);

public record ApplyModifierRequest(
    Guid CombatantId,
    Guid ModifierTypeId,
    int? Duration);
