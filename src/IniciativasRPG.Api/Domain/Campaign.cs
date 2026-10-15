namespace IniciativasRPG.Api.Domain;

public class Campaign
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public string PublicToken { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<Battle> Battles { get; set; } = new List<Battle>();
    public ICollection<Sheet> Sheets { get; set; } = new List<Sheet>();
    public ICollection<CampaignScene> Scenes { get; set; } = new List<CampaignScene>();
}
