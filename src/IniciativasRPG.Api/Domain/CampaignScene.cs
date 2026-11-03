namespace IniciativasRPG.Api.Domain;

public class CampaignScene
{
    public Guid Id { get; set; }
    public Guid CampaignId { get; set; }
    public Campaign Campaign { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public SceneKind Kind { get; set; } = SceneRules.KindDefault;
    public string? ImageUrl { get; set; }
    public byte[]? ImageContent { get; set; }
    public string? ImageContentType { get; set; }
    public Guid? SheetId { get; set; }
    public Sheet? Sheet { get; set; }
    public int SortOrder { get; set; }
    public bool IsVisibleToPlayers { get; set; } = SceneRules.VisibleToPlayersDefault;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public ICollection<CampaignSceneTag> SceneTags { get; set; } = new List<CampaignSceneTag>();
}
