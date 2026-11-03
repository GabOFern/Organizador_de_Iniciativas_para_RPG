using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Services;

public interface ISceneService
{
    Task<IReadOnlyList<CampaignSceneDto>> ListByCampaignAsync(Guid campaignId, CancellationToken ct = default);
    Task<IReadOnlyList<CampaignImageTagDto>> ListTagsAsync(Guid campaignId, CancellationToken ct = default);
    Task<CampaignImageTagDto> CreateTagAsync(Guid campaignId, string? name, CancellationToken ct = default);
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
        IReadOnlyCollection<Guid>? tagIds = null,
        Guid? sheetId = null,
        CancellationToken ct = default);
    Task<IReadOnlyList<CampaignSceneDto>> UpdateAsync(
        Guid campaignId,
        Guid sceneId,
        string? title,
        string? kind,
        string? imageUrl,
        IFormFile? file,
        IReadOnlyCollection<Guid>? tagIds = null,
        Guid? sheetId = null,
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
    private readonly IImageStoreOptimizer _images;

    public SceneService(AppDbContext db, IBattleNotifier notifier, ISceneImageFetcher imageFetcher, IImageStoreOptimizer images)
    {
        _db = db;
        _notifier = notifier;
        _imageFetcher = imageFetcher;
        _images = images;
    }

    public async Task<IReadOnlyList<CampaignSceneDto>> ListByCampaignAsync(
        Guid campaignId,
        CancellationToken ct = default)
    {
        var token = await PublicTokenAsync(campaignId, ct);
        return await ListAsync(campaignId, token, visibleOnly: false, forMaster: true, ct);
    }

    public async Task<IReadOnlyList<CampaignImageTagDto>> ListTagsAsync(
        Guid campaignId,
        CancellationToken ct = default) =>
        await _db.CampaignImageTags
            .AsNoTracking()
            .Where(t => t.CampaignId == campaignId)
            .OrderBy(t => t.Name)
            .Select(t => new CampaignImageTagDto(t.Id, t.Name))
            .ToListAsync(ct);

    public async Task<CampaignImageTagDto> CreateTagAsync(
        Guid campaignId,
        string? name,
        CancellationToken ct = default)
    {
        var normalizedName = NormalizeTagName(name);
        var campaignTags = await _db.CampaignImageTags
            .AsNoTracking()
            .Where(t => t.CampaignId == campaignId)
            .Select(t => new CampaignImageTagDto(t.Id, t.Name))
            .ToListAsync(ct);
        var existing = campaignTags.FirstOrDefault(
            t => string.Equals(t.Name, normalizedName, StringComparison.OrdinalIgnoreCase));

        if (existing is not null)
        {
            return existing;
        }

        if (campaignTags.Count >= SceneRules.MaxTagsPerCampaign)
        {
            throw new DomainException(DomainMessages.SceneTagCampaignFull);
        }

        var tag = new CampaignImageTag
        {
            Id = Guid.NewGuid(),
            CampaignId = campaignId,
            Name = normalizedName,
        };
        _db.CampaignImageTags.Add(tag);
        await _db.SaveChangesAsync(ct);
        return new CampaignImageTagDto(tag.Id, tag.Name);
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
        IReadOnlyCollection<Guid>? tagIds = null,
        Guid? sheetId = null,
        CancellationToken ct = default)
    {
        var normalizedTitle = NormalizeTitle(title);
        var sceneKind = ParseAssignableKind(kind);
        var hasFile = file is not null && file.Length > 0;
        var trimmedUrl = string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl.Trim();
        var sourceCount = CountImageSources(hasFile, trimmedUrl, sheetId);

        if (sourceCount > 1)
        {
            throw new DomainException(DomainMessages.SceneImageSourceConflict);
        }

        if (sourceCount == 0)
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

        await ApplyImageSourceAsync(scene, campaignId, trimmedUrl, file, hasFile, sheetId, ct);
        await ApplyTagsAsync(scene, campaignId, tagIds ?? Array.Empty<Guid>(), ct);

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
        IReadOnlyCollection<Guid>? tagIds = null,
        Guid? sheetId = null,
        CancellationToken ct = default)
    {
        var scene = await _db.CampaignScenes
                .FirstOrDefaultAsync(s => s.Id == sceneId && s.CampaignId == campaignId, ct)
            ?? throw new DomainException(DomainMessages.SceneNotFound, StatusCodes.Status404NotFound);

        scene.Title = NormalizeTitle(title);
        scene.Kind = ParseAssignableKind(kind);

        var hasFile = file is not null && file.Length > 0;
        var trimmedUrl = string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl.Trim();
        var sourceCount = CountImageSources(hasFile, trimmedUrl, sheetId);

        if (sourceCount > 1)
        {
            throw new DomainException(DomainMessages.SceneImageSourceConflict);
        }

        if (sourceCount == 1)
        {
            await ApplyImageSourceAsync(scene, campaignId, trimmedUrl, file, hasFile, sheetId, ct);
        }

        await ApplyTagsAsync(scene, campaignId, tagIds ?? Array.Empty<Guid>(), ct);

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
            .Select(s => new { s.Id, s.Title, s.SortOrder, s.IsVisibleToPlayers, s.Kind, s.SheetId })
            .ToListAsync(ct);

        var tagsByScene = new Dictionary<Guid, IReadOnlyList<CampaignImageTagDto>>();
        if (forMaster && rows.Count > 0)
        {
            var sceneIds = rows.Select(s => s.Id).ToArray();
            var tagRows = await _db.CampaignSceneTags
                .AsNoTracking()
                .Where(st => sceneIds.Contains(st.SceneId))
                .OrderBy(st => st.Tag.Name)
                .Select(st => new { st.SceneId, st.Tag.Id, st.Tag.Name })
                .ToListAsync(ct);
            tagsByScene = tagRows
                .GroupBy(t => t.SceneId)
                .ToDictionary(
                    group => group.Key,
                    group => (IReadOnlyList<CampaignImageTagDto>)group
                        .Select(t => new CampaignImageTagDto(t.Id, t.Name))
                        .ToList());
        }

        return rows
            .Select(s => new CampaignSceneDto(
                s.Id,
                s.Title,
                s.SheetId.HasValue
                    ? forMaster
                        ? SheetImagePaths.Master(s.SheetId.Value)
                        : SheetImagePaths.Public(publicToken, s.SheetId.Value)
                    : forMaster
                        ? SceneImagePaths.Master(s.Id)
                        : SceneImagePaths.Public(publicToken, s.Id),
                s.SortOrder,
                s.IsVisibleToPlayers,
                s.Kind,
                tagsByScene.GetValueOrDefault(s.Id) ?? Array.Empty<CampaignImageTagDto>(),
                s.SheetId))
            .ToList();
    }

    private async Task ApplyTagsAsync(
        CampaignScene scene,
        Guid campaignId,
        IReadOnlyCollection<Guid> tagIds,
        CancellationToken ct)
    {
        var distinctTagIds = tagIds.Distinct().ToArray();
        if (distinctTagIds.Length > SceneRules.MaxTagsPerScene)
        {
            throw new DomainException(DomainMessages.SceneTooManyTags);
        }

        var validTagIds = await _db.CampaignImageTags
            .Where(t => t.CampaignId == campaignId && distinctTagIds.Contains(t.Id))
            .Select(t => t.Id)
            .ToListAsync(ct);
        if (validTagIds.Count != distinctTagIds.Length)
        {
            throw new DomainException(DomainMessages.SceneTagNotFound);
        }

        var currentTags = await _db.CampaignSceneTags
            .Where(st => st.SceneId == scene.Id)
            .ToListAsync(ct);
        _db.CampaignSceneTags.RemoveRange(currentTags);
        scene.SceneTags = validTagIds
            .Select(tagId => new CampaignSceneTag { SceneId = scene.Id, TagId = tagId })
            .ToList();
    }

    private async Task<SceneImageFile> LoadOrFetchAsync(CampaignScene scene, CancellationToken ct)
    {
        if (scene.SheetId.HasValue)
        {
            var sheetImage = await _db.SheetImages
                .AsNoTracking()
                .Where(i => i.SheetId == scene.SheetId.Value && i.Sheet.CampaignId == scene.CampaignId)
                .Select(i => new SceneImageFile(i.Content, i.ContentType))
                .FirstOrDefaultAsync(ct);

            return sheetImage
                ?? throw new DomainException(DomainMessages.SheetNotFound, StatusCodes.Status404NotFound);
        }

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
        Guid campaignId,
        string? trimmedUrl,
        IFormFile? file,
        bool hasFile,
        Guid? sheetId,
        CancellationToken ct)
    {
        if (sheetId.HasValue)
        {
            var belongsToCampaign = await _db.Sheets
                .AnyAsync(s => s.Id == sheetId.Value && s.CampaignId == campaignId, ct);
            if (!belongsToCampaign)
            {
                throw new DomainException(DomainMessages.SceneSheetNotFound);
            }

            scene.SheetId = sheetId;
            scene.ImageContent = null;
            scene.ImageContentType = null;
            scene.ImageUrl = null;
            return;
        }

        scene.SheetId = null;
        if (hasFile)
        {
            var image = await ReadImageAsync(file!, ct);
            scene.ImageContent = image.Content;
            scene.ImageContentType = image.ContentType;
            scene.ImageUrl = null;
            return;
        }

        var fetched = await _imageFetcher.FetchAsync(NormalizeImageUrl(trimmedUrl), ct);
        scene.ImageContent = fetched.Content;
        scene.ImageContentType = fetched.ContentType;
        scene.ImageUrl = null;
    }

    private static int CountImageSources(bool hasFile, string? trimmedUrl, Guid? sheetId) =>
        (hasFile ? 1 : 0) + (trimmedUrl is not null ? 1 : 0) + (sheetId.HasValue ? 1 : 0);

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

    private static string NormalizeTagName(string? name)
    {
        var trimmed = name?.Trim() ?? string.Empty;
        if (trimmed.Length == 0)
        {
            throw new DomainException(DomainMessages.SceneTagNameRequired);
        }

        if (trimmed.Length > SceneRules.MaxTagNameLength)
        {
            throw new DomainException(DomainMessages.SceneTagNameTooLong);
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

    private async Task<ImageStoreResult> ReadImageAsync(IFormFile file, CancellationToken ct)
    {
        if (file.Length == 0)
        {
            throw new DomainException(DomainMessages.SheetImageRequired);
        }

        if (file.Length > SceneRules.MaxImageUploadBytes)
        {
            throw new DomainException(DomainMessages.SheetImageUploadTooLarge);
        }

        await using var stream = file.OpenReadStream();
        using var buffer = new MemoryStream();
        await stream.CopyToAsync(buffer, ct);
        if (buffer.Length > SceneRules.MaxImageUploadBytes)
        {
            throw new DomainException(DomainMessages.SheetImageUploadTooLarge);
        }

        return _images.Prepare(buffer.GetBuffer().AsSpan(0, (int)buffer.Length));
    }
}
