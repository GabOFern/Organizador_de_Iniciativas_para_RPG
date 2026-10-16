using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Domain;

namespace IniciativasRPG.Api.Services;

public interface ISceneImageFetcher
{
    Task<SceneImageFile> FetchAsync(string url, CancellationToken ct = default);
}

public static class SceneImageLog
{
    public const string RemoteUnavailable = "Imagem remota indisponível.";
    public const string InternalFailure = "Falha interna ao baixar a imagem.";
}

public sealed class SceneImageFetcher : ISceneImageFetcher
{
    private readonly HttpClient _http;
    private readonly ILogger<SceneImageFetcher> _logger;
    private readonly IImageStoreOptimizer _images;

    public SceneImageFetcher(HttpClient http, ILogger<SceneImageFetcher> logger, IImageStoreOptimizer images)
    {
        _http = http;
        _logger = logger;
        _images = images;
    }

    public async Task<SceneImageFile> FetchAsync(string url, CancellationToken ct = default)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new DomainException(DomainMessages.SheetImageUrlInvalid);
        }

        try
        {
            using var response = await _http.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, ct);
            if (!response.IsSuccessStatusCode)
            {
                LogRemote(uri, (int)response.StatusCode);
                throw new DomainException(DomainMessages.SceneImageLinkFailed);
            }

            if (response.Content.Headers.ContentLength is long length && length > SceneRules.MaxImageUploadBytes)
            {
                LogRemote(uri, reason: DomainMessages.SheetImageUploadTooLarge);
                throw new DomainException(DomainMessages.SheetImageUploadTooLarge);
            }

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            var content = await ReadLimitedAsync(stream, uri, ct);
            try
            {
                var stored = _images.Prepare(content);
                return new SceneImageFile(stored.Content, stored.ContentType);
            }
            catch (DomainException ex)
            {
                LogRemote(uri, reason: ex.Message);
                throw;
            }
        }
        catch (DomainException)
        {
            throw;
        }
        catch (Exception ex) when ((ex is HttpRequestException || ex is TaskCanceledException) && !ct.IsCancellationRequested)
        {
            LogRemote(uri, reason: ex.GetType().Name);
            throw new DomainException(DomainMessages.SceneImageLinkFailed);
        }
        catch (Exception ex) when (!ct.IsCancellationRequested)
        {
            _logger.LogError(
                ex,
                "{Reason} Host {Host}.",
                SceneImageLog.InternalFailure,
                uri.Host);
            throw;
        }
    }

    private void LogRemote(Uri uri, int? statusCode = null, string? reason = null)
    {
        if (statusCode is int status)
        {
            _logger.LogWarning(
                "{Reason} Host {Host} HTTP {StatusCode}.",
                SceneImageLog.RemoteUnavailable,
                uri.Host,
                status);
            return;
        }

        _logger.LogWarning(
            "{Reason} Host {Host}. {Detail}",
            SceneImageLog.RemoteUnavailable,
            uri.Host,
            reason);
    }

    private async Task<byte[]> ReadLimitedAsync(Stream stream, Uri uri, CancellationToken ct)
    {
        using var buffer = new MemoryStream();
        var chunk = new byte[81920];
        while (true)
        {
            var read = await stream.ReadAsync(chunk, ct);
            if (read == 0)
            {
                break;
            }

            if (buffer.Length + read > SceneRules.MaxImageUploadBytes)
            {
                LogRemote(uri, reason: DomainMessages.SheetImageUploadTooLarge);
                throw new DomainException(DomainMessages.SheetImageUploadTooLarge);
            }

            buffer.Write(chunk, 0, read);
        }

        if (buffer.Length == 0)
        {
            LogRemote(uri, reason: DomainMessages.SceneImageLinkFailed);
            throw new DomainException(DomainMessages.SceneImageLinkFailed);
        }

        return buffer.ToArray();
    }
}
