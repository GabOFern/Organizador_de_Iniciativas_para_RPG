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
    private readonly IDemoBattleService _demoBattleService;

    public BattleController(IBattleService battleService, IDemoBattleService demoBattleService)
    {
        _battleService = battleService;
        _demoBattleService = demoBattleService;
    }

    private Guid CampaignId => User.GetRequiredCampaignId();

    [HttpGet("current")]
    public async Task<ActionResult<BattleSnapshotDto>> Current(CancellationToken ct) =>
        Ok(await _battleService.GetCurrentAsync(CampaignId, ct));

    [HttpPost("invoke-player")]
    public async Task<ActionResult<BattleSnapshotDto>> InvokePlayer([FromBody] InvokePlayerRequest request, CancellationToken ct) =>
        Ok(await _battleService.InvokePlayerAsync(CampaignId, request, ct));

    [HttpPost("invoke-creature")]
    public async Task<ActionResult<BattleSnapshotDto>> InvokeCreature([FromBody] InvokeCreatureRequest request, CancellationToken ct) =>
        Ok(await _battleService.InvokeCreatureAsync(CampaignId, request, ct));

    [HttpPost("start")]
    public async Task<ActionResult<BattleSnapshotDto>> Start(CancellationToken ct) =>
        Ok(await _battleService.StartAsync(CampaignId, ct));

    [HttpPost("next")]
    public async Task<ActionResult<BattleSnapshotDto>> Next(CancellationToken ct) =>
        Ok(await _battleService.NextAsync(CampaignId, ct));

    [HttpPost("finish")]
    public async Task<ActionResult<BattleSnapshotDto>> Finish(CancellationToken ct) =>
        Ok(await _battleService.FinishAsync(CampaignId, ct: ct));

    [HttpPost("save-player-stats")]
    public async Task<ActionResult<BattleSnapshotDto>> SavePlayerStats(CancellationToken ct) =>
        Ok(await _battleService.SavePlayerStatsAsync(CampaignId, ct));

    [HttpPost("damage")]
    public async Task<ActionResult<BattleSnapshotDto>> Damage([FromBody] DamageRequest request, CancellationToken ct) =>
        Ok(await _battleService.ApplyDamageAsync(CampaignId, request, ct));

    [HttpPost("heal")]
    public async Task<ActionResult<BattleSnapshotDto>> Heal([FromBody] HealRequest request, CancellationToken ct) =>
        Ok(await _battleService.ApplyHealAsync(CampaignId, request, ct));

    [HttpPost("kill")]
    public async Task<ActionResult<BattleSnapshotDto>> Kill([FromBody] KillRequest request, CancellationToken ct) =>
        Ok(await _battleService.KillAsync(CampaignId, request, ct));

    [HttpPost("revive")]
    public async Task<ActionResult<BattleSnapshotDto>> Revive([FromBody] ReviveRequest request, CancellationToken ct) =>
        Ok(await _battleService.ReviveAsync(CampaignId, request, ct));

    [HttpPost("modifiers")]
    public async Task<ActionResult<BattleSnapshotDto>> ApplyModifier([FromBody] ApplyModifierRequest request, CancellationToken ct) =>
        Ok(await _battleService.ApplyModifierAsync(CampaignId, request, ct));

    [HttpDelete("modifiers/{id:guid}")]
    public async Task<ActionResult<BattleSnapshotDto>> RemoveModifier(Guid id, CancellationToken ct) =>
        Ok(await _battleService.RemoveModifierAsync(CampaignId, id, ct));

    [HttpGet("combatants/{id:guid}/tactical")]
    public async Task<ActionResult<CombatantTacticalDto>> Tactical(Guid id, CancellationToken ct) =>
        Ok(await _battleService.GetCombatantTacticalAsync(CampaignId, id, ct));

    [HttpPost("test/start")]
    public async Task<ActionResult<BattleSnapshotDto>> StartTestBattle(CancellationToken ct) =>
        Ok(await _demoBattleService.StartTestBattleAsync(CampaignId, ct));

    [HttpPost("test/tick")]
    public async Task<ActionResult<BattleSnapshotDto>> TickTestBattle(CancellationToken ct) =>
        Ok(await _demoBattleService.TickTestBattleAsync(CampaignId, ct));
}
