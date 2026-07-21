using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IniciativasRPG.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/battle")]
public class BattleController : ControllerBase
{
    private readonly IBattleService _battleService;

    public BattleController(IBattleService battleService)
    {
        _battleService = battleService;
    }

    [HttpGet("current")]
    public async Task<ActionResult<BattleSnapshotDto>> Current(CancellationToken ct) =>
        Ok(await _battleService.GetCurrentAsync(ct));

    [HttpPost("invoke-player")]
    public async Task<ActionResult<BattleSnapshotDto>> InvokePlayer([FromBody] InvokePlayerRequest request, CancellationToken ct) =>
        Ok(await _battleService.InvokePlayerAsync(request, ct));

    [HttpPost("invoke-creature")]
    public async Task<ActionResult<BattleSnapshotDto>> InvokeCreature([FromBody] InvokeCreatureRequest request, CancellationToken ct) =>
        Ok(await _battleService.InvokeCreatureAsync(request, ct));

    [HttpPost("start")]
    public async Task<ActionResult<BattleSnapshotDto>> Start(CancellationToken ct) =>
        Ok(await _battleService.StartAsync(ct));

    [HttpPost("next")]
    public async Task<ActionResult<BattleSnapshotDto>> Next(CancellationToken ct) =>
        Ok(await _battleService.NextAsync(ct));

    [HttpPost("finish")]
    public async Task<ActionResult<BattleSnapshotDto>> Finish(CancellationToken ct) =>
        Ok(await _battleService.FinishAsync(ct));

    [HttpPost("damage")]
    public async Task<ActionResult<BattleSnapshotDto>> Damage([FromBody] DamageRequest request, CancellationToken ct) =>
        Ok(await _battleService.ApplyDamageAsync(request, ct));

    [HttpPost("kill")]
    public async Task<ActionResult<BattleSnapshotDto>> Kill([FromBody] KillRequest request, CancellationToken ct) =>
        Ok(await _battleService.KillAsync(request, ct));
}
