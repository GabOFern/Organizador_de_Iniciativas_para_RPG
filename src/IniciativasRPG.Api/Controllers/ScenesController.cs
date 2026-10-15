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

    [HttpPost]
    [RequestSizeLimit(SceneRules.MaxImageRequestBytes)]
    public async Task<ActionResult<IReadOnlyList<CampaignSceneDto>>> Create(
        [FromForm] string? title,
        [FromForm] string? kind,
        [FromForm] string? imageUrl,
        IFormFile? file,
        CancellationToken ct) =>
        Ok(await _sceneService.CreateAsync(CampaignId, title, kind, imageUrl, file, ct));

    [HttpPut("{id:guid}")]
    [RequestSizeLimit(SceneRules.MaxImageRequestBytes)]
    public async Task<ActionResult<IReadOnlyList<CampaignSceneDto>>> Update(
        Guid id,
        [FromForm] string? title,
        [FromForm] string? kind,
        [FromForm] string? imageUrl,
        IFormFile? file,
        CancellationToken ct) =>
        Ok(await _sceneService.UpdateAsync(CampaignId, id, title, kind, imageUrl, file, ct));

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
