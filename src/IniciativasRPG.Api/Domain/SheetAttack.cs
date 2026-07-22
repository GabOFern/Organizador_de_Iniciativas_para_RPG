namespace IniciativasRPG.Api.Domain;

public class SheetAttack
{
    public Guid Id { get; set; }
    public Guid SheetId { get; set; }
    public Sheet Sheet { get; set; } = null!;
    public string Description { get; set; } = string.Empty;
    public string DamageDice { get; set; } = string.Empty;
    public AbilityName AbilityBase { get; set; }
    public StrikeType StrikeType { get; set; }
    public int SortOrder { get; set; }
}
