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
        [FromForm] string? imageUrl,
        IFormFile? file,
        CancellationToken ct) =>
        Ok(await _sceneService.CreateAsync(CampaignId, title, imageUrl, file, ct));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<IReadOnlyList<CampaignSceneDto>>> Delete(Guid id, CancellationToken ct) =>
        Ok(await _sceneService.DeleteAsync(CampaignId, id, ct));
}
