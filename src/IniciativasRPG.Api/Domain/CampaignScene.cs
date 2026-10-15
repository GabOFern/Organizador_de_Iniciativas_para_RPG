namespace IniciativasRPG.Api.Domain;

public class CampaignScene
{
    public Guid Id { get; set; }
    public Guid CampaignId { get; set; }
    public Campaign Campaign { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public byte[]? ImageContent { get; set; }
    public string? ImageContentType { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
