namespace IniciativasRPG.Api.Domain;

public static class SceneRules
{
    public const int MaxScenesPerCampaign = 30;
    public const int MaxTitleLength = 120;
    public const int MaxImageUrlLength = 1000;
    public const int MaxImageBytes = SheetRules.MaxImageBytes;
    public const int MaxImageUploadBytes = SheetRules.MaxImageUploadBytes;
    public const int MaxImageRequestBytes = SheetRules.MaxImageRequestBytes;
    public const int MaxImageContentTypeLength = 32;
    public const int ImageFetchTimeoutSeconds = 15;
    public const int MaxKindLength = 20;

    /// <summary>Novas imagens ficam ocultas aos jogadores até o mestre abrir o olho.</summary>
    public const bool VisibleToPlayersDefault = false;

    /// <summary>Imagens antigas e default de migration até o mestre classificar.</summary>
    public const SceneKind KindDefault = SceneKind.Uncategorized;

    public static bool IsAssignableKind(SceneKind kind) =>
        kind is SceneKind.Item or SceneKind.Npc or SceneKind.Card or SceneKind.Map;
}

public static class SceneImagePaths
{
    public static string Master(Guid sceneId) =>
        $"/api/scenes/{sceneId}/image";

    public static string Public(string publicToken, Guid sceneId) =>
        $"/api/public/campaigns/{publicToken}/scenes/{sceneId}/image";
}
