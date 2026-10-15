using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace IniciativasRPG.Api.Hubs;

public class BattleHub : Hub
{
    private readonly IBattleService _battleService;
    private readonly ISceneService _sceneService;

    public BattleHub(IBattleService battleService, ISceneService sceneService)
    {
        _battleService = battleService;
        _sceneService = sceneService;
    }

    public static string PublicGroupName(string publicToken) => $"battle:{publicToken}:public";
    public static string MasterGroupName(string publicToken) => $"battle:{publicToken}:master";

    [Obsolete("Use PublicGroupName / MasterGroupName")]
    public static string GroupName(string publicToken) => PublicGroupName(publicToken);

    [AllowAnonymous]
    public async Task JoinBattle(string publicToken)
    {
        if (string.IsNullOrWhiteSpace(publicToken))
        {
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, PublicGroupName(publicToken));
        var snapshot = await _battleService.GetByPublicTokenAsync(publicToken, forPublic: true);
        await Clients.Caller.SendAsync(BattleNotifier.BattleUpdatedEvent, snapshot);
        await SendScenesAsync(publicToken, forPublic: true);
    }

    [Authorize]
    public async Task JoinBattleMaster(string publicToken)
    {
        if (string.IsNullOrWhiteSpace(publicToken))
        {
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, MasterGroupName(publicToken));
        var snapshot = await _battleService.GetByPublicTokenAsync(publicToken, forPublic: false);
        await Clients.Caller.SendAsync(BattleNotifier.BattleUpdatedEvent, snapshot);
        await SendScenesAsync(publicToken, forPublic: false);
    }

    private async Task SendScenesAsync(string publicToken, bool forPublic)
    {
        IReadOnlyList<CampaignSceneDto> scenes;
        try
        {
            scenes = forPublic
                ? await _sceneService.ListByPublicTokenAsync(publicToken)
                : await _sceneService.ListMasterByPublicTokenAsync(publicToken);
        }
        catch (DomainException)
        {
            scenes = Array.Empty<CampaignSceneDto>();
        }

        await Clients.Caller.SendAsync(BattleNotifier.ScenesUpdatedEvent, scenes);
    }
}
