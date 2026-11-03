namespace IniciativasRPG.Api.Domain;

public class CampaignSceneTag
{
    public Guid SceneId { get; set; }
    public CampaignScene Scene { get; set; } = null!;
    public Guid TagId { get; set; }
    public CampaignImageTag Tag { get; set; } = null!;
}
