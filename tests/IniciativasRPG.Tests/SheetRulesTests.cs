using FluentAssertions;
using IniciativasRPG.Api.Domain;

namespace IniciativasRPG.Tests;

public class SheetRulesTests
{
    [Fact]
    public void DetectImageContentType_Jpeg_ReturnsJpeg()
    {
        byte[] jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0x00];
        SheetRules.DetectImageContentType(jpeg).Should().Be(SheetRules.JpegContentType);
    }

    [Fact]
    public void DetectImageContentType_Png_ReturnsPng()
    {
        byte[] png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00];
        SheetRules.DetectImageContentType(png).Should().Be(SheetRules.PngContentType);
    }

    [Fact]
    public void DetectImageContentType_Gif89a_ReturnsGif()
    {
        byte[] gif = [(byte)'G', (byte)'I', (byte)'F', (byte)'8', (byte)'9', (byte)'a', 0x00];
        SheetRules.DetectImageContentType(gif).Should().Be(SheetRules.GifContentType);
    }

    [Fact]
    public void DetectImageContentType_WebP_ReturnsWebP()
    {
        byte[] webp =
        [
            (byte)'R', (byte)'I', (byte)'F', (byte)'F',
            0x00, 0x00, 0x00, 0x00,
            (byte)'W', (byte)'E', (byte)'B', (byte)'P',
            0x00
        ];
        SheetRules.DetectImageContentType(webp).Should().Be(SheetRules.WebpContentType);
    }

    [Fact]
    public void DetectImageContentType_UnknownBytes_ReturnsNull()
    {
        byte[] unknown = [0x00, 0x01, 0x02, 0x03];
        SheetRules.DetectImageContentType(unknown).Should().BeNull();
    }

    [Fact]
    public void DetectImageContentType_EmptyContent_ReturnsNull()
    {
        SheetRules.DetectImageContentType(ReadOnlySpan<byte>.Empty).Should().BeNull();
    }

    [Fact]
    public void ImageScaleDefaults_AreConsistent()
    {
        SheetRules.ImageScaleDefault.Should().Be(1);
        SheetRules.ImageScaleMin.Should().BeLessThan(SheetRules.ImageScaleDefault);
        SheetRules.ImageScaleMax.Should().BeGreaterThan(SheetRules.ImageScaleDefault);
    }
}
