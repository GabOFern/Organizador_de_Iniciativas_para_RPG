using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IniciativasRPG.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/lineups")]
public class LineupsController : ControllerBase
{
    private readonly ILineupService _lineups;

    public LineupsController(ILineupService lineups)
    {
        _lineups = lineups;
    }

    private Guid CampaignId => User.GetRequiredCampaignId();

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LineupDto>>> List(CancellationToken ct) =>
        Ok(await _lineups.ListAsync(CampaignId, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LineupDto>> Get(Guid id, CancellationToken ct) =>
        Ok(await _lineups.GetAsync(CampaignId, id, ct));

    [HttpPost]
    public async Task<ActionResult<LineupDto>> Create([FromBody] SaveLineupRequest request, CancellationToken ct)
    {
        var lineup = await _lineups.CreateAsync(CampaignId, request, ct);
        return CreatedAtAction(nameof(Get), new { id = lineup.Id }, lineup);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<LineupDto>> Update(Guid id, [FromBody] SaveLineupRequest request, CancellationToken ct) =>
        Ok(await _lineups.UpdateAsync(CampaignId, id, request, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _lineups.DeleteAsync(CampaignId, id, ct);
        return NoContent();
    }
}
