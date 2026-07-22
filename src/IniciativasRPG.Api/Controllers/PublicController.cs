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

    public PublicController(IBattleService battleService, ICampaignService campaignService)
    {
        _battleService = battleService;
        _campaignService = campaignService;
    }

    [HttpGet("campaigns")]
    public async Task<ActionResult<IReadOnlyList<CampaignSummaryDto>>> ListCampaigns(CancellationToken ct) =>
        Ok(await _campaignService.ListAsync(ct));

    [HttpGet("campaigns/{token}")]
    public async Task<ActionResult<BattleSnapshotDto>> GetCampaignBattle(string token, CancellationToken ct) =>
        Ok(await _battleService.GetByPublicTokenAsync(token, forPublic: true, ct));
}
