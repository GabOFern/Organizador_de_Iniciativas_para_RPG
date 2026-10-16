namespace IniciativasRPG.Api.Domain;

public readonly record struct ImageStoreLimits(
    int MaxStoredBytes,
    int MaxUploadBytes,
    int MaxEdgePixels,
    int WebpQualityHigh,
    int WebpQualityFloor)
{
    public static ImageStoreLimits Production { get; } = new(
        SheetRules.MaxImageBytes,
        SheetRules.MaxImageUploadBytes,
        SheetRules.MaxImageEdgePixels,
        SheetRules.WebpQualityHigh,
        SheetRules.WebpQualityFloor);
}
