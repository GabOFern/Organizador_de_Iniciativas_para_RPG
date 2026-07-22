namespace IniciativasRPG.Api.Domain;

public class SheetSpell
{
    public Guid Id { get; set; }
    public Guid SheetId { get; set; }
    public Sheet Sheet { get; set; } = null!;
    public string Description { get; set; } = string.Empty;
    public string? DamageDice { get; set; }
    public int SlotLevel { get; set; }
    public bool RequiresMaterial { get; set; }
    public AbilityName AbilityBase { get; set; }
    public int SortOrder { get; set; }
}
