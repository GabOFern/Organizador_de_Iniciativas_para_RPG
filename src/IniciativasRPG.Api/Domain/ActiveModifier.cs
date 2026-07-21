namespace IniciativasRPG.Api.Domain;

public class ActiveModifier
{
    public Guid Id { get; set; }
    public Guid CombatantId { get; set; }
    public Combatant Combatant { get; set; } = null!;
    public Guid? ModifierTypeId { get; set; }
    public ModifierType? ModifierType { get; set; }
    public string Name { get; set; } = string.Empty;
    public int RemainingDuration { get; set; }
    public bool SkipsTurn { get; set; }
    public string IconKey { get; set; } = ModifierIconKeys.Default;
    public string? IconUrl { get; set; }
    public int AcDelta { get; set; }
    public DamageMode DamageMode { get; set; } = DamageMode.None;
    public int? DamageAmount { get; set; }
    public string? DamageDice { get; set; }
    public int? ResolvedDamage { get; set; }
    public int? LastTickDamage { get; set; }
    public DamageMode HealMode { get; set; } = DamageMode.None;
    public int? HealAmount { get; set; }
    public string? HealDice { get; set; }
    public int? ResolvedHeal { get; set; }
    public int? LastTickHeal { get; set; }
}
