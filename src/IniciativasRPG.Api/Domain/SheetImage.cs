namespace IniciativasRPG.Api.Domain;

public class SheetImage
{
    public Guid SheetId { get; set; }
    public Sheet Sheet { get; set; } = null!;
    public byte[] Content { get; set; } = [];
    public string ContentType { get; set; } = string.Empty;
}
