namespace IniciativasRPG.Api.Domain;

public class ModifierType
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DefaultDuration { get; set; }
    public bool SkipsTurn { get; set; }
    public string IconKey { get; set; } = ModifierIconKeys.Default;
    public string? IconUrl { get; set; }
    public int AcDelta { get; set; }
    public DamageMode DamageMode { get; set; } = DamageMode.None;
    public int? DamageAmount { get; set; }
    public string? DamageDice { get; set; }
    public DamageMode HealMode { get; set; } = DamageMode.None;
    public int? HealAmount { get; set; }
    public string? HealDice { get; set; }

    public ICollection<ActiveModifier> ActiveModifiers { get; set; } = new List<ActiveModifier>();
}
