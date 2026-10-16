namespace IniciativasRPG.Api.Domain;

public class LineupMember
{
    public Guid Id { get; set; }
    public Guid LineupId { get; set; }
    public Lineup Lineup { get; set; } = null!;
    public Guid SheetId { get; set; }
    public Sheet Sheet { get; set; } = null!;
    public int Quantity { get; set; }
    public int SortOrder { get; set; }
}
