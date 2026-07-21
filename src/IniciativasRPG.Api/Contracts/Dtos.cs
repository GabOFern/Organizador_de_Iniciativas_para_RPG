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
    bool SkipsTurn);

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
    IReadOnlyList<ActiveModifierDto> Modifiers);

public record BattleSnapshotDto(
    Guid? Id,
    string? PublicToken,
    string Status,
    int CurrentTurnIndex,
    IReadOnlyList<CombatantDto> Combatants,
    string? Message,
    int? LastDiceRoll);

public record InvokePlayerRequest(Guid SheetId, int Initiative, bool ConfirmDuplicate = false);
public record InvokeCreatureRequest(
    Guid SheetId,
    int? Initiative,
    bool RollDice,
    string? DiceNotation);
public record DamageRequest(Guid CombatantId, int Amount);
public record HealRequest(Guid CombatantId, int Amount);
public record KillRequest(Guid CombatantId);
public record ReviveRequest(Guid CombatantId, int? HealAmount);

public record ModifierTypeDto(
    Guid Id,
    string Name,
    int DefaultDuration,
    bool SkipsTurn);

public record CreateModifierTypeRequest(
    string Name,
    int DefaultDuration,
    bool SkipsTurn);

public record UpdateModifierTypeRequest(
    string Name,
    int DefaultDuration,
    bool SkipsTurn);

public record ApplyModifierRequest(
    Guid CombatantId,
    Guid ModifierTypeId,
    int? Duration);
