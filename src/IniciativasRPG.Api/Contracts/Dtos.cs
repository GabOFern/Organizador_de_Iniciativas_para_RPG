using IniciativasRPG.Api.Domain;

namespace IniciativasRPG.Api.Contracts;

public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, string Username);

public record CreateCampaignRequest(string Name, string? ImageUrl, string? Description, string Password);
public record CampaignMasterLoginRequest(string Password);
public record CampaignSummaryDto(
    Guid Id,
    string Name,
    string? ImageUrl,
    string? Description,
    string PublicToken,
    DateTime CreatedAtUtc);
public record CampaignMasterLoginResponse(string Token, Guid CampaignId, string CampaignName, string PublicToken);

public record SheetDto(
    Guid Id,
    string Name,
    string? ImageUrl,
    double ImageFocusX,
    double ImageFocusY,
    double ImageScale,
    string Type,
    string Class,
    int MaxHp,
    int CurrentHp,
    int BaseAc,
    int DexModifier,
    int InitiativeBonus,
    int ProficiencyBonus,
    int Strength,
    int StrengthMod,
    int Dexterity,
    int DexterityMod,
    int Constitution,
    int ConstitutionMod,
    int Intelligence,
    int IntelligenceMod,
    int Wisdom,
    int WisdomMod,
    int Charisma,
    int CharismaMod,
    IReadOnlyList<SheetFeatureDto> Features,
    IReadOnlyList<SheetAttackDto> Attacks,
    IReadOnlyList<SheetSpellDto> Spells,
    IReadOnlyList<SheetWeaponDto> Weapons,
    bool HasStoredImage);

public record SheetFeatureDto(
    Guid? Id,
    string Kind,
    string Title,
    string Text,
    int SortOrder);

public record SheetFeatureInput(
    SheetFeatureKind Kind,
    string Title,
    string Text);

public record SheetAttackDto(
    Guid? Id,
    string Description,
    string DamageDice,
    string AbilityBase,
    string StrikeType,
    int SortOrder);

public record SheetSpellDto(
    Guid? Id,
    string Description,
    string? DamageDice,
    int SlotLevel,
    bool RequiresMaterial,
    string AbilityBase,
    int SortOrder);

public record SheetWeaponDto(
    Guid? Id,
    string Description,
    string DamageDice,
    string Range,
    string StrikeType,
    int SortOrder);

public record SheetAttackInput(
    string Description,
    string DamageDice,
    AbilityName AbilityBase,
    StrikeType StrikeType);

public record SheetSpellInput(
    string Description,
    string? DamageDice,
    int SlotLevel,
    bool RequiresMaterial,
    AbilityName AbilityBase);

public sealed record SheetImageFile(byte[] Content, string ContentType);

public record CampaignSceneDto(Guid Id, string Title, string ImageUrl, int SortOrder);

public sealed record SceneImageFile(byte[] Content, string ContentType);

public record SheetWeaponInput(
    string Description,
    string DamageDice,
    string Range,
    StrikeType StrikeType);

public record CreateSheetRequest(
    string Name,
    string? ImageUrl,
    SheetType Type,
    CharacterClass Class,
    int MaxHp,
    int BaseAc,
    int Strength,
    int Dexterity,
    int Constitution,
    int Intelligence,
    int Wisdom,
    int Charisma,
    IReadOnlyList<SheetFeatureInput>? Features = null,
    IReadOnlyList<SheetAttackInput>? Attacks = null,
    IReadOnlyList<SheetSpellInput>? Spells = null,
    IReadOnlyList<SheetWeaponInput>? Weapons = null,
    double ImageFocusX = 50,
    double ImageFocusY = 50,
    double ImageScale = SheetRules.ImageScaleDefault,
    int InitiativeBonus = 0,
    int ProficiencyBonus = SheetRules.DefaultProficiencyBonus);

public record UpdateSheetRequest(
    string Name,
    string? ImageUrl,
    SheetType Type,
    CharacterClass Class,
    int MaxHp,
    int CurrentHp,
    int BaseAc,
    int Strength,
    int Dexterity,
    int Constitution,
    int Intelligence,
    int Wisdom,
    int Charisma,
    IReadOnlyList<SheetFeatureInput>? Features = null,
    IReadOnlyList<SheetAttackInput>? Attacks = null,
    IReadOnlyList<SheetSpellInput>? Spells = null,
    IReadOnlyList<SheetWeaponInput>? Weapons = null,
    double ImageFocusX = 50,
    double ImageFocusY = 50,
    double ImageScale = SheetRules.ImageScaleDefault,
    int InitiativeBonus = 0,
    int ProficiencyBonus = SheetRules.DefaultProficiencyBonus);

public record CombatantTacticalDto(
    Guid CombatantId,
    Guid SheetId,
    string Name,
    string SheetType,
    string Class,
    int Strength,
    int StrengthMod,
    int Dexterity,
    int DexterityMod,
    int Constitution,
    int ConstitutionMod,
    int Intelligence,
    int IntelligenceMod,
    int Wisdom,
    int WisdomMod,
    int Charisma,
    int CharismaMod,
    int ProficiencyBonus,
    IReadOnlyList<SheetFeatureDto> Features,
    IReadOnlyList<SheetAttackDto> Attacks,
    IReadOnlyList<SheetSpellDto> Spells,
    IReadOnlyList<SheetWeaponDto> Weapons);

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
    double ImageFocusX,
    double ImageFocusY,
    double ImageScale,
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
