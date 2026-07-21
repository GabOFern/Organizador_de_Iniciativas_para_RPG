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

    public PublicController(IBattleService battleService)
    {
        _battleService = battleService;
    }

    [HttpGet("battles")]
    public async Task<ActionResult<IReadOnlyList<PublicBattleSummaryDto>>> ListBattles(CancellationToken ct) =>
        Ok(await _battleService.ListOpenBattlesForPublicAsync(ct));

    [HttpGet("battles/{token}")]
    public async Task<ActionResult<BattleSnapshotDto>> GetBattle(string token, CancellationToken ct) =>
        Ok(await _battleService.GetByPublicTokenAsync(token, forPublic: true, ct));
}
