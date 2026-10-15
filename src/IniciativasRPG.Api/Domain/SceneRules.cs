namespace IniciativasRPG.Api.Domain;

public static class SceneRules
{
    public const int MaxScenesPerCampaign = 30;
    public const int MaxTitleLength = 120;
    public const int MaxImageUrlLength = 1000;
    public const int MaxImageBytes = 4 * 1024 * 1024;
    public const int MaxImageRequestBytes = MaxImageBytes + 64 * 1024;
    public const int MaxImageContentTypeLength = 32;
}

public static class SceneImagePaths
{
    public static string Public(string publicToken, Guid sceneId) =>
        $"/api/public/campaigns/{publicToken}/scenes/{sceneId}/image";
}
