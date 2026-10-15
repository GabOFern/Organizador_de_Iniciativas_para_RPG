using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IniciativasRPG.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/public")]
public class PublicController : ControllerBase
{
    private readonly IBattleService _battleService;
    private readonly ICampaignService _campaignService;
    private readonly ISheetService _sheetService;

    public PublicController(
        IBattleService battleService,
        ICampaignService campaignService,
        ISheetService sheetService)
    {
        _battleService = battleService;
        _campaignService = campaignService;
        _sheetService = sheetService;
    }

    [HttpGet("campaigns")]
    public async Task<ActionResult<IReadOnlyList<CampaignSummaryDto>>> ListCampaigns(CancellationToken ct) =>
        Ok(await _campaignService.ListAsync(ct));

    [HttpGet("campaigns/{token}")]
    public async Task<ActionResult<BattleSnapshotDto>> GetCampaignBattle(string token, CancellationToken ct) =>
        Ok(await _battleService.GetByPublicTokenAsync(token, forPublic: true, ct));

    [HttpGet("campaigns/{token}/sheets/{sheetId:guid}/image")]
    public async Task<IActionResult> GetSheetImage(string token, Guid sheetId, CancellationToken ct)
    {
        var image = await _sheetService.GetPublicImageAsync(token, sheetId, ct);
        return File(image.Content, image.ContentType);
    }
}
