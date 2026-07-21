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
}
