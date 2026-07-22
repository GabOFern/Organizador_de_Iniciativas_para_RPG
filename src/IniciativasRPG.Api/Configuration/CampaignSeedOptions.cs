namespace IniciativasRPG.Api.Configuration;

public class CampaignSeedOptions
{
    public const string SectionName = "CampaignSeed";

    public string Name { get; set; } = "Campanha inicial";
    public string Password { get; set; } = string.Empty;
}
