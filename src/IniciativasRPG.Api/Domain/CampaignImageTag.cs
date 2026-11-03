namespace IniciativasRPG.Api.Domain;

public class CampaignImageTag
{
    public Guid Id { get; set; }
    public Guid CampaignId { get; set; }
    public Campaign Campaign { get; set; } = null!;
    public string Name { get; set; } = string.Empty;

    public ICollection<CampaignSceneTag> SceneTags { get; set; } = new List<CampaignSceneTag>();
}
