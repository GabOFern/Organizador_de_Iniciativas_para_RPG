using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Services;

public interface ISceneService
{
    Task<IReadOnlyList<CampaignSceneDto>> ListByCampaignAsync(Guid campaignId, CancellationToken ct = default);
    Task<IReadOnlyList<CampaignSceneDto>> ListByPublicTokenAsync(string publicToken, CancellationToken ct = default);
    Task<IReadOnlyList<CampaignSceneDto>> ListMasterByPublicTokenAsync(string publicToken, CancellationToken ct = default);
    Task<SceneImageFile> GetMasterImageAsync(Guid campaignId, Guid sceneId, CancellationToken ct = default);
    Task<SceneImageFile> GetPublicImageAsync(string publicToken, Guid sceneId, CancellationToken ct = default);
    Task<IReadOnlyList<CampaignSceneDto>> CreateAsync(
        Guid campaignId,
        string? title,
        string? kind,
        string? imageUrl,
        IFormFile? file,
        CancellationToken ct = default);
    Task<IReadOnlyList<CampaignSceneDto>> UpdateAsync(
        Guid campaignId,
        Guid sceneId,
        string? title,
        string? kind,
        string? imageUrl,
        IFormFile? file,
        CancellationToken ct = default);
    Task<IReadOnlyList<CampaignSceneDto>> SetVisibilityAsync(
        Guid campaignId,
        Guid sceneId,
        bool isVisibleToPlayers,
        CancellationToken ct = default);
    Task<IReadOnlyList<CampaignSceneDto>> DeleteAsync(Guid campaignId, Guid sceneId, CancellationToken ct = default);
}

public class SceneService : ISceneService
{
    private readonly AppDbContext _db;
    private readonly IBattleNotifier _notifier;
    private readonly ISceneImageFetcher _imageFetcher;

    public SceneService(AppDbContext db, IBattleNotifier notifier, ISceneImageFetcher imageFetcher)
    {
        _db = db;
        _notifier = notifier;
        _imageFetcher = imageFetcher;
    }

    public async Task<IReadOnlyList<CampaignSceneDto>> ListByCampaignAsync(
        Guid campaignId,
        CancellationToken ct = default)
    {
        var token = await PublicTokenAsync(campaignId, ct);
        return await ListAsync(campaignId, token, visibleOnly: false, forMaster: true, ct);
    }

    public async Task<IReadOnlyList<CampaignSceneDto>> ListByPublicTokenAsync(
        string publicToken,
        CancellationToken ct = default)
    {
        var campaignId = await ResolveCampaignIdAsync(publicToken, ct);
        return await ListAsync(campaignId, publicToken, visibleOnly: true, forMaster: false, ct);
    }

    public async Task<IReadOnlyList<CampaignSceneDto>> ListMasterByPublicTokenAsync(
        string publicToken,
        CancellationToken ct = default)
    {
        var campaignId = await ResolveCampaignIdAsync(publicToken, ct);
        return await ListAsync(campaignId, publicToken, visibleOnly: false, forMaster: true, ct);
    }

    public async Task<SceneImageFile> GetMasterImageAsync(
        Guid campaignId,
        Guid sceneId,
        CancellationToken ct = default)
    {
        var scene = await _db.CampaignScenes
                .FirstOrDefaultAsync(s => s.Id == sceneId && s.CampaignId == campaignId, ct)
            ?? throw new DomainException(DomainMessages.SceneNotFound, StatusCodes.Status404NotFound);

        return await LoadOrFetchAsync(scene, ct);
    }

    public async Task<SceneImageFile> GetPublicImageAsync(
        string publicToken,
        Guid sceneId,
        CancellationToken ct = default)
    {
        var scene = await _db.CampaignScenes
            .FirstOrDefaultAsync(s =>
                s.Id == sceneId &&
                s.Campaign.PublicToken == publicToken &&
                s.IsVisibleToPlayers, ct);

        if (scene is null)
        {
            throw new DomainException(DomainMessages.SceneNotFound, StatusCodes.Status404NotFound);
        }

        return await LoadOrFetchAsync(scene, ct);
    }

    public async Task<IReadOnlyList<CampaignSceneDto>> CreateAsync(
        Guid campaignId,
        string? title,
        string? kind,
        string? imageUrl,
        IFormFile? file,
        CancellationToken ct = default)
    {
        var normalizedTitle = NormalizeTitle(title);
        var sceneKind = ParseAssignableKind(kind);
        var hasFile = file is not null && file.Length > 0;
        var trimmedUrl = string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl.Trim();

        if (hasFile && trimmedUrl is not null)
        {
            throw new DomainException(DomainMessages.SceneImageSourceConflict);
        }

        if (!hasFile && trimmedUrl is null)
        {
            throw new DomainException(DomainMessages.SceneImageSourceRequired);
        }

        var count = await _db.CampaignScenes.CountAsync(s => s.CampaignId == campaignId, ct);
        if (count >= SceneRules.MaxScenesPerCampaign)
        {
            throw new DomainException(DomainMessages.SceneCampaignFull);
        }

        var nextOrder = await _db.CampaignScenes
            .Where(s => s.CampaignId == campaignId)
            .MaxAsync(s => (int?)s.SortOrder, ct) ?? -1;

        var scene = new CampaignScene
        {
            Id = Guid.NewGuid(),
            CampaignId = campaignId,
            Title = normalizedTitle,
            Kind = sceneKind,
            SortOrder = nextOrder + 1,
            IsVisibleToPlayers = SceneRules.VisibleToPlayersDefault,
            CreatedAtUtc = DateTime.UtcNow,
        };

        await ApplyImageSourceAsync(scene, trimmedUrl, file, hasFile, ct);

        _db.CampaignScenes.Add(scene);
        await _db.SaveChangesAsync(ct);

        var token = await PublicTokenAsync(campaignId, ct);
        await _notifier.NotifyScenesUpdatedAsync(token, ct);
        return await ListAsync(campaignId, token, visibleOnly: false, forMaster: true, ct);
    }

    public async Task<IReadOnlyList<CampaignSceneDto>> UpdateAsync(
        Guid campaignId,
        Guid sceneId,
        string? title,
        string? kind,
        string? imageUrl,
        IFormFile? file,
        CancellationToken ct = default)
    {
        var scene = await _db.CampaignScenes
                .FirstOrDefaultAsync(s => s.Id == sceneId && s.CampaignId == campaignId, ct)
            ?? throw new DomainException(DomainMessages.SceneNotFound, StatusCodes.Status404NotFound);

        scene.Title = NormalizeTitle(title);
        scene.Kind = ParseAssignableKind(kind);

        var hasFile = file is not null && file.Length > 0;
        var trimmedUrl = string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl.Trim();

        if (hasFile && trimmedUrl is not null)
        {
            throw new DomainException(DomainMessages.SceneImageSourceConflict);
        }

        if (hasFile || trimmedUrl is not null)
        {
            await ApplyImageSourceAsync(scene, trimmedUrl, file, hasFile, ct);
        }

        await _db.SaveChangesAsync(ct);

        var token = await PublicTokenAsync(campaignId, ct);
        await _notifier.NotifyScenesUpdatedAsync(token, ct);
        return await ListAsync(campaignId, token, visibleOnly: false, forMaster: true, ct);
    }

    public async Task<IReadOnlyList<CampaignSceneDto>> SetVisibilityAsync(
        Guid campaignId,
        Guid sceneId,
        bool isVisibleToPlayers,
        CancellationToken ct = default)
    {
        var scene = await _db.CampaignScenes
                .FirstOrDefaultAsync(s => s.Id == sceneId && s.CampaignId == campaignId, ct)
            ?? throw new DomainException(DomainMessages.SceneNotFound, StatusCodes.Status404NotFound);

        scene.IsVisibleToPlayers = isVisibleToPlayers;
        await _db.SaveChangesAsync(ct);

        var token = await PublicTokenAsync(campaignId, ct);
        await _notifier.NotifyScenesUpdatedAsync(token, ct);
        return await ListAsync(campaignId, token, visibleOnly: false, forMaster: true, ct);
    }

    public async Task<IReadOnlyList<CampaignSceneDto>> DeleteAsync(
        Guid campaignId,
        Guid sceneId,
        CancellationToken ct = default)
    {
        var deleted = await _db.CampaignScenes
            .Where(s => s.Id == sceneId && s.CampaignId == campaignId)
            .ExecuteDeleteAsync(ct);

        if (deleted == 0)
        {
            throw new DomainException(DomainMessages.SceneNotFound, StatusCodes.Status404NotFound);
        }

        var token = await PublicTokenAsync(campaignId, ct);
        await _notifier.NotifyScenesUpdatedAsync(token, ct);
        return await ListAsync(campaignId, token, visibleOnly: false, forMaster: true, ct);
    }

    private async Task<Guid> ResolveCampaignIdAsync(string publicToken, CancellationToken ct) =>
        await _db.Campaigns
            .AsNoTracking()
            .Where(c => c.PublicToken == publicToken)
            .Select(c => (Guid?)c.Id)
            .FirstOrDefaultAsync(ct)
        ?? throw new DomainException(DomainMessages.CampaignNotFound, StatusCodes.Status404NotFound);

    private async Task<IReadOnlyList<CampaignSceneDto>> ListAsync(
        Guid campaignId,
        string publicToken,
        bool visibleOnly,
        bool forMaster,
        CancellationToken ct)
    {
        var query = _db.CampaignScenes
            .AsNoTracking()
            .Where(s => s.CampaignId == campaignId);

        if (visibleOnly)
        {
            query = query.Where(s => s.IsVisibleToPlayers);
        }

        var ordered = visibleOnly
            ? query.OrderByDescending(s => s.SortOrder).ThenByDescending(s => s.CreatedAtUtc)
            : query.OrderBy(s => s.SortOrder).ThenBy(s => s.CreatedAtUtc);

        var rows = await ordered
            .Select(s => new { s.Id, s.Title, s.SortOrder, s.IsVisibleToPlayers, s.Kind })
            .ToListAsync(ct);

        return rows
            .Select(s => new CampaignSceneDto(
                s.Id,
                s.Title,
                forMaster
                    ? SceneImagePaths.Master(s.Id)
                    : SceneImagePaths.Public(publicToken, s.Id),
                s.SortOrder,
                s.IsVisibleToPlayers,
                s.Kind))
            .ToList();
    }

    private async Task<SceneImageFile> LoadOrFetchAsync(CampaignScene scene, CancellationToken ct)
    {
        if (scene.ImageContent is { Length: > 0 } && !string.IsNullOrWhiteSpace(scene.ImageContentType))
        {
            return new SceneImageFile(scene.ImageContent, scene.ImageContentType);
        }

        if (string.IsNullOrWhiteSpace(scene.ImageUrl))
        {
            throw new DomainException(DomainMessages.SceneNotFound, StatusCodes.Status404NotFound);
        }

        var fetched = await _imageFetcher.FetchAsync(scene.ImageUrl, ct);
        scene.ImageContent = fetched.Content;
        scene.ImageContentType = fetched.ContentType;
        scene.ImageUrl = null;
        await _db.SaveChangesAsync(ct);
        return fetched;
    }

    private async Task<string> PublicTokenAsync(Guid campaignId, CancellationToken ct) =>
        await _db.Campaigns
            .Where(c => c.Id == campaignId)
            .Select(c => c.PublicToken)
            .FirstAsync(ct);

    private static SceneKind ParseAssignableKind(string? kind)
    {
        if (string.IsNullOrWhiteSpace(kind))
        {
            throw new DomainException(DomainMessages.SceneKindRequired);
        }

        if (!Enum.TryParse<SceneKind>(kind.Trim(), ignoreCase: true, out var parsed)
            || !SceneRules.IsAssignableKind(parsed))
        {
            throw new DomainException(DomainMessages.SceneKindInvalid);
        }

        return parsed;
    }

    private async Task ApplyImageSourceAsync(
        CampaignScene scene,
        string? trimmedUrl,
        IFormFile? file,
        bool hasFile,
        CancellationToken ct)
    {
        if (hasFile)
        {
            var content = await ReadImageAsync(file!, ct);
            var contentType = SheetRules.DetectImageContentType(content)
                ?? throw new DomainException(DomainMessages.SheetImageTypeInvalid);
            scene.ImageContent = content;
            scene.ImageContentType = contentType;
            scene.ImageUrl = null;
            return;
        }

        var fetched = await _imageFetcher.FetchAsync(NormalizeImageUrl(trimmedUrl), ct);
        scene.ImageContent = fetched.Content;
        scene.ImageContentType = fetched.ContentType;
        scene.ImageUrl = null;
    }

    private static string NormalizeTitle(string? title)
    {
        var trimmed = title?.Trim() ?? string.Empty;
        if (trimmed.Length == 0)
        {
            throw new DomainException(DomainMessages.SceneTitleRequired);
        }

        if (trimmed.Length > SceneRules.MaxTitleLength)
        {
            throw new DomainException(DomainMessages.SceneTitleTooLong);
        }

        return trimmed;
    }

    private static string NormalizeImageUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            throw new DomainException(DomainMessages.SceneImageSourceRequired);
        }

        var trimmed = url.Trim();
        if (trimmed.Length > SceneRules.MaxImageUrlLength)
        {
            throw new DomainException(DomainMessages.SheetImageUrlTooLong);
        }

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new DomainException(DomainMessages.SheetImageUrlInvalid);
        }

        return trimmed;
    }

    private static async Task<byte[]> ReadImageAsync(IFormFile file, CancellationToken ct)
    {
        if (file.Length == 0)
        {
            throw new DomainException(DomainMessages.SheetImageRequired);
        }

        if (file.Length > SceneRules.MaxImageBytes)
        {
            throw new DomainException(DomainMessages.SheetImageTooLarge);
        }

        await using var stream = file.OpenReadStream();
        using var buffer = new MemoryStream();
        await stream.CopyToAsync(buffer, ct);
        if (buffer.Length > SceneRules.MaxImageBytes)
        {
            throw new DomainException(DomainMessages.SheetImageTooLarge);
        }

        return buffer.ToArray();
    }
}
