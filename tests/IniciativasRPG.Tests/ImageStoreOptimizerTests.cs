using FluentAssertions;
using IniciativasRPG.Api.Domain;
using IniciativasRPG.Api.Services;
using IniciativasRPG.Tests.Helpers;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace IniciativasRPG.Tests;

public class ImageStoreOptimizerTests
{
    [Fact]
    public void ProductionLimits_Stored4Mb_Upload20Mb()
    {
        ImageStoreLimits.Production.MaxStoredBytes.Should().Be(SheetRules.MaxImageBytes);
        ImageStoreLimits.Production.MaxUploadBytes.Should().Be(SheetRules.MaxImageUploadBytes);
        SheetRules.MaxImageBytes.Should().Be(4 * 1024 * 1024);
        SheetRules.MaxImageUploadBytes.Should().Be(20 * 1024 * 1024);
        SheetRules.MaxImageEdgePixels.Should().Be(2560);
        SceneRules.MaxImageBytes.Should().Be(SheetRules.MaxImageBytes);
        SceneRules.MaxImageRequestBytes.Should().Be(SheetRules.MaxImageUploadBytes);
    }

    [Fact]
    public void Prepare_WithinStoredLimit_KeepsOriginalBytes()
    {
        var png = PngImages.Noise(8, 8);
        var sut = new ImageStoreOptimizer(ImageStoreLimits.Production);

        var result = sut.Prepare(png);

        result.Content.Should().Equal(png);
        result.ContentType.Should().Be(SheetRules.PngContentType);
    }

    [Fact]
    public void Prepare_AboveUploadLimit_ThrowsUploadTooLarge()
    {
        var limits = Limits(stored: 100, upload: 20, edge: 32);
        var sut = new ImageStoreOptimizer(limits);

        var act = () => sut.Prepare(new byte[limits.MaxUploadBytes + 1]);

        act.Should().Throw<DomainException>()
            .WithMessage(DomainMessages.SheetImageUploadTooLarge);
    }

    [Fact]
    public void Prepare_UnrecognizedBytes_ThrowsTypeInvalid()
    {
        var sut = new ImageStoreOptimizer(Limits(stored: 100, upload: 1000, edge: 32));

        var act = () => sut.Prepare([1, 2, 3, 4, 5, 6, 7, 8]);

        act.Should().Throw<DomainException>()
            .WithMessage(DomainMessages.SheetImageTypeInvalid);
    }

    [Fact]
    public void Prepare_Oversized_FitsStoredLimit_AndLongestEdge()
    {
        var png = PngImages.Noise(180, 90);
        var limits = Limits(stored: 700, upload: png.Length + 10, edge: 40);
        png.Length.Should().BeGreaterThan(limits.MaxStoredBytes);
        var sut = new ImageStoreOptimizer(limits);

        var result = sut.Prepare(png);

        result.Content.Length.Should().BeLessThanOrEqualTo(limits.MaxStoredBytes);
        result.ContentType.Should().Be(SheetRules.WebpContentType);
        using var decoded = Image.Load<Rgba32>(result.Content);
        Math.Max(decoded.Width, decoded.Height).Should().BeLessThanOrEqualTo(limits.MaxEdgePixels);
        decoded.Width.Should().BeGreaterThan(decoded.Height);
    }

    [Fact]
    public void Prepare_WhenLosslessFits_MatchesResizedPixels()
    {
        var png = PngImages.Noise(96, 48, seed: 2);
        const int edge = 24;
        var losslessBytes = LosslessOfResized(png, edge);
        png.Length.Should().BeGreaterThan(losslessBytes.Length);
        var limits = Limits(stored: losslessBytes.Length, upload: png.Length + 10, edge: edge);
        var sut = new ImageStoreOptimizer(limits);

        var result = sut.Prepare(png);

        result.ContentType.Should().Be(SheetRules.WebpContentType);
        result.Content.Length.Should().BeLessThanOrEqualTo(limits.MaxStoredBytes);
        PixelsMatch(result.Content, Resize(png, edge)).Should().BeTrue();
    }

    [Fact]
    public void Prepare_AnimatedGifAboveStoredLimit_KeepsFirstFramePixels()
    {
        var gif = AnimatedGif();
        var limits = Limits(stored: gif.Length - 1, upload: gif.Length + 10, edge: 64);
        var sut = new ImageStoreOptimizer(limits);

        var result = sut.Prepare(gif);

        result.ContentType.Should().Be(SheetRules.WebpContentType);
        result.Content.Length.Should().BeLessThanOrEqualTo(limits.MaxStoredBytes);
        using var decoded = Image.Load<Rgba32>(result.Content);
        decoded.Frames.Count.Should().Be(1);
        decoded[0, 0].R.Should().Be(255);
        decoded[0, 0].G.Should().Be(0);
    }

    [Fact]
    public void Prepare_WhenLosslessExceedsStored_StoresLossyWithinLimit()
    {
        var png = PngImages.Noise(96, 48, seed: 3);
        const int edge = 48;
        var losslessBytes = LosslessOfResized(png, edge);
        var limits = Limits(stored: losslessBytes.Length - 1, upload: png.Length + 10, edge: edge);
        png.Length.Should().BeGreaterThan(limits.MaxStoredBytes);
        var sut = new ImageStoreOptimizer(limits);

        var result = sut.Prepare(png);

        result.Content.Length.Should().BeLessThanOrEqualTo(limits.MaxStoredBytes);
        result.Content.Length.Should().BeLessThan(losslessBytes.Length);
        result.ContentType.Should().Be(SheetRules.WebpContentType);
        PixelsMatch(result.Content, Resize(png, edge)).Should().BeFalse();
    }

    private static byte[] AnimatedGif()
    {
        using var first = new Image<Rgba32>(12, 12, Color.Red);
        using var second = new Image<Rgba32>(12, 12, Color.Blue);
        first.Frames.AddFrame(second.Frames.RootFrame);
        using var buffer = new MemoryStream();
        first.SaveAsGif(buffer);
        return buffer.ToArray();
    }

    private static ImageStoreLimits Limits(int stored, int upload, int edge) => new(
        stored,
        upload,
        edge,
        SheetRules.WebpQualityHigh,
        SheetRules.WebpQualityFloor);

    private static byte[] LosslessOfResized(byte[] png, int edge)
    {
        using var image = Resize(png, edge);
        using var buffer = new MemoryStream();
        image.SaveAsWebp(buffer, new SixLabors.ImageSharp.Formats.Webp.WebpEncoder
        {
            FileFormat = SixLabors.ImageSharp.Formats.Webp.WebpFileFormatType.Lossless,
            Quality = SheetRules.WebpQualityHigh,
        });
        return buffer.ToArray();
    }

    private static Image<Rgba32> Resize(byte[] png, int edge)
    {
        var image = Image.Load<Rgba32>(png);
        image.Mutate(ctx => ctx.Resize(new ResizeOptions
        {
            Size = new Size(edge, edge),
            Mode = ResizeMode.Max,
            Sampler = KnownResamplers.Lanczos3,
        }));
        return image;
    }

    private static bool PixelsMatch(byte[] encoded, Image<Rgba32> expected)
    {
        using var actual = Image.Load<Rgba32>(encoded);
        if (actual.Width != expected.Width || actual.Height != expected.Height)
        {
            return false;
        }

        for (var y = 0; y < actual.Height; y++)
        {
            for (var x = 0; x < actual.Width; x++)
            {
                if (actual[x, y] != expected[x, y])
                {
                    return false;
                }
            }
        }

        return true;
    }
}
