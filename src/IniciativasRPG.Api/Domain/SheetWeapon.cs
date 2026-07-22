namespace IniciativasRPG.Api.Domain;

public class SheetWeapon
{
    public Guid Id { get; set; }
    public Guid SheetId { get; set; }
    public Sheet Sheet { get; set; } = null!;
    public string Description { get; set; } = string.Empty;
    public string DamageDice { get; set; } = string.Empty;
    public string Range { get; set; } = string.Empty;
    public StrikeType StrikeType { get; set; }
    public int SortOrder { get; set; }
}
