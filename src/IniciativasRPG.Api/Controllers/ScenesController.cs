using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Domain;
using IniciativasRPG.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IniciativasRPG.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/scenes")]
public class ScenesController : ControllerBase
{
    private readonly ISceneService _sceneService;

    public ScenesController(ISceneService sceneService)
    {
        _sceneService = sceneService;
    }

    private Guid CampaignId => User.GetRequiredCampaignId();

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CampaignSceneDto>>> List(CancellationToken ct) =>
        Ok(await _sceneService.ListByCampaignAsync(CampaignId, ct));

    [HttpGet("tags")]
    public async Task<ActionResult<IReadOnlyList<CampaignImageTagDto>>> ListTags(CancellationToken ct) =>
        Ok(await _sceneService.ListTagsAsync(CampaignId, ct));

    [HttpPost("tags")]
    public async Task<ActionResult<CampaignImageTagDto>> CreateTag(
        [FromBody] CreateCampaignImageTagRequest request,
        CancellationToken ct) =>
        Ok(await _sceneService.CreateTagAsync(CampaignId, request.Name, ct));

    [HttpGet("{id:guid}/image")]
    public async Task<IActionResult> Image(Guid id, CancellationToken ct)
    {
        var image = await _sceneService.GetMasterImageAsync(CampaignId, id, ct);
        return File(image.Content, image.ContentType);
    }

    [HttpPost]
    [RequestSizeLimit(SceneRules.MaxImageRequestBytes)]
    public async Task<ActionResult<IReadOnlyList<CampaignSceneDto>>> Create(
        [FromForm] string? title,
        [FromForm] string? kind,
        [FromForm] string? imageUrl,
        IFormFile? file,
        [FromForm] Guid[]? tagIds,
        [FromForm] Guid? sheetId,
        CancellationToken ct) =>
        Ok(await _sceneService.CreateAsync(
            CampaignId, title, kind, imageUrl, file, tagIds, sheetId, ct));

    [HttpPut("{id:guid}")]
    [RequestSizeLimit(SceneRules.MaxImageRequestBytes)]
    public async Task<ActionResult<IReadOnlyList<CampaignSceneDto>>> Update(
        Guid id,
        [FromForm] string? title,
        [FromForm] string? kind,
        [FromForm] string? imageUrl,
        IFormFile? file,
        [FromForm] Guid[]? tagIds,
        [FromForm] Guid? sheetId,
        CancellationToken ct) =>
        Ok(await _sceneService.UpdateAsync(
            CampaignId, id, title, kind, imageUrl, file, tagIds, sheetId, ct));

    [HttpPatch("{id:guid}/visibility")]
    public async Task<ActionResult<IReadOnlyList<CampaignSceneDto>>> SetVisibility(
        Guid id,
        [FromBody] SetSceneVisibilityRequest request,
        CancellationToken ct) =>
        Ok(await _sceneService.SetVisibilityAsync(CampaignId, id, request.IsVisibleToPlayers, ct));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<IReadOnlyList<CampaignSceneDto>>> Delete(Guid id, CancellationToken ct) =>
        Ok(await _sceneService.DeleteAsync(CampaignId, id, ct));
}
