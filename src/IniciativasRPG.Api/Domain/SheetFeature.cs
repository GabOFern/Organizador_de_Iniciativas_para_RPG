namespace IniciativasRPG.Api.Domain;

public class SheetFeature
{
    public Guid Id { get; set; }
    public Guid SheetId { get; set; }
    public Sheet Sheet { get; set; } = null!;
    public SheetFeatureKind Kind { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
