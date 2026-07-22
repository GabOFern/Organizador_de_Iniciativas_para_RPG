using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IniciativasRPG.Api.Controllers;

[ApiController]
[Route("api/campaigns")]
public class CampaignsController : ControllerBase
{
    private readonly ICampaignService _campaignService;

    public CampaignsController(ICampaignService campaignService)
    {
        _campaignService = campaignService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<CampaignSummaryDto>>> List(CancellationToken ct) =>
        Ok(await _campaignService.ListAsync(ct));

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<CampaignSummaryDto>> Create([FromBody] CreateCampaignRequest request, CancellationToken ct)
    {
        var created = await _campaignService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), new { id = created.Id }, created);
    }

    [HttpPost("{id:guid}/master-login")]
    [AllowAnonymous]
    public async Task<ActionResult<CampaignMasterLoginResponse>> MasterLogin(
        Guid id,
        [FromBody] CampaignMasterLoginRequest request,
        CancellationToken ct) =>
        Ok(await _campaignService.MasterLoginAsync(id, request, ct));
}
