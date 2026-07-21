namespace IniciativasRPG.Api.Domain;

public class Sheet
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public SheetType Type { get; set; }
    public int MaxHp { get; set; }
    public int CurrentHp { get; set; }
    public int BaseAc { get; set; }
    public int DexModifier { get; set; }

    public ICollection<Combatant> Combatants { get; set; } = new List<Combatant>();
}
