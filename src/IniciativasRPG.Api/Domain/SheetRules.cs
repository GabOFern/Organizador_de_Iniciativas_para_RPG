namespace IniciativasRPG.Api.Domain;

public static class SheetRules
{
    public const int DefaultProficiencyBonus = 2;
    public const int MaxImageUrlLength = 1000;
    public const int MaxImageBytes = 4 * 1024 * 1024;
    public const int MaxImageRequestBytes = MaxImageBytes + 64 * 1024;
    public const int MaxImageContentTypeLength = 32;

    public const string JpegContentType = "image/jpeg";
    public const string PngContentType = "image/png";
    public const string WebpContentType = "image/webp";
    public const string GifContentType = "image/gif";

    public static string? DetectImageContentType(ReadOnlySpan<byte> content)
    {
        if (content.Length >= 3 && content[0] == 0xFF && content[1] == 0xD8 && content[2] == 0xFF)
        {
            return JpegContentType;
        }

        if (content.Length >= 8
            && content[0] == 0x89
            && content[1] == 0x50
            && content[2] == 0x4E
            && content[3] == 0x47
            && content[4] == 0x0D
            && content[5] == 0x0A
            && content[6] == 0x1A
            && content[7] == 0x0A)
        {
            return PngContentType;
        }

        if (content.Length >= 6
            && content[0] == (byte)'G'
            && content[1] == (byte)'I'
            && content[2] == (byte)'F'
            && content[3] == (byte)'8'
            && (content[4] == (byte)'7' || content[4] == (byte)'9')
            && content[5] == (byte)'a')
        {
            return GifContentType;
        }

        if (content.Length >= 12
            && content[0] == (byte)'R'
            && content[1] == (byte)'I'
            && content[2] == (byte)'F'
            && content[3] == (byte)'F'
            && content[8] == (byte)'W'
            && content[9] == (byte)'E'
            && content[10] == (byte)'B'
            && content[11] == (byte)'P')
        {
            return WebpContentType;
        }

        return null;
    }
}

public static class SheetImagePaths
{
    public static string Public(string publicToken, Guid sheetId) =>
        $"/api/public/campaigns/{publicToken}/sheets/{sheetId}/image";
}
