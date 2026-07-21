namespace IniciativasRPG.Api.Domain;

public class ModifierType
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DefaultDuration { get; set; }
    public bool SkipsTurn { get; set; }

    public ICollection<ActiveModifier> ActiveModifiers { get; set; } = new List<ActiveModifier>();
}
