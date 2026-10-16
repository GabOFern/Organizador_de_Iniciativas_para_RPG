using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;

namespace IniciativasRPG.Tests.Helpers;

public static class PngImages
{
    public static byte[] Noise(int width, int height, int seed = 1)
    {
        using var image = new Image<Rgba32>(width, height);
        var random = new Random(seed);
        image.ProcessPixelRows(accessor =>
        {
            for (var y = 0; y < accessor.Height; y++)
            {
                var row = accessor.GetRowSpan(y);
                for (var x = 0; x < row.Length; x++)
                {
                    row[x] = new Rgba32(
                        (byte)random.Next(256),
                        (byte)random.Next(256),
                        (byte)random.Next(256));
                }
            }
        });

        using var buffer = new MemoryStream();
        image.SaveAsPng(buffer);
        return buffer.ToArray();
    }
}
