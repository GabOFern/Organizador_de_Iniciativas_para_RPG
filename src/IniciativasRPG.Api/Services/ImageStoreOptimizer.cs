using IniciativasRPG.Api.Domain;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace IniciativasRPG.Api.Services;

public interface IImageStoreOptimizer
{
    ImageStoreResult Prepare(ReadOnlySpan<byte> content);
}

public readonly record struct ImageStoreResult(byte[] Content, string ContentType);

public sealed class ImageStoreOptimizer : IImageStoreOptimizer
{
    private readonly ImageStoreLimits _limits;

    public ImageStoreOptimizer(ImageStoreLimits limits)
    {
        _limits = limits;
    }

    public ImageStoreResult Prepare(ReadOnlySpan<byte> content)
    {
        if (content.Length > _limits.MaxUploadBytes)
        {
            throw new DomainException(DomainMessages.SheetImageUploadTooLarge);
        }

        if (content.Length == 0)
        {
            throw new DomainException(DomainMessages.SheetImageRequired);
        }

        var detected = SheetRules.DetectImageContentType(content)
            ?? throw new DomainException(DomainMessages.SheetImageTypeInvalid);

        if (content.Length <= _limits.MaxStoredBytes)
        {
            return new ImageStoreResult(content.ToArray(), detected);
        }

        try
        {
            using var decoded = Image.Load(content);
            using var frame = decoded.Frames.Count > 1 ? decoded.Frames.CloneFrame(0) : null;
            var image = frame ?? decoded;
            if (image.Width > _limits.MaxEdgePixels || image.Height > _limits.MaxEdgePixels)
            {
                image.Mutate(ctx => ctx.Resize(new ResizeOptions
                {
                    Size = new Size(_limits.MaxEdgePixels, _limits.MaxEdgePixels),
                    Mode = ResizeMode.Max,
                    Sampler = KnownResamplers.Lanczos3,
                }));
            }

            var lossless = Encode(image, lossless: true, quality: SheetRules.WebpQualityHigh);
            if (lossless.Length <= _limits.MaxStoredBytes)
            {
                return new ImageStoreResult(lossless, SheetRules.WebpContentType);
            }

            var high = Encode(image, lossless: false, quality: _limits.WebpQualityHigh);
            if (high.Length <= _limits.MaxStoredBytes)
            {
                return new ImageStoreResult(high, SheetRules.WebpContentType);
            }

            var floor = Encode(image, lossless: false, quality: _limits.WebpQualityFloor);
            if (floor.Length <= _limits.MaxStoredBytes)
            {
                return new ImageStoreResult(floor, SheetRules.WebpContentType);
            }

            throw new DomainException(DomainMessages.SheetImageTooLarge);
        }
        catch (DomainException)
        {
            throw;
        }
        catch (UnknownImageFormatException)
        {
            throw new DomainException(DomainMessages.SheetImageTypeInvalid);
        }
        catch (InvalidImageContentException)
        {
            throw new DomainException(DomainMessages.SheetImageTypeInvalid);
        }
    }

    private static byte[] Encode(Image image, bool lossless, int quality)
    {
        using var buffer = new MemoryStream();
        image.SaveAsWebp(buffer, new WebpEncoder
        {
            FileFormat = lossless ? WebpFileFormatType.Lossless : WebpFileFormatType.Lossy,
            Quality = quality,
        });
        return buffer.ToArray();
    }
}
