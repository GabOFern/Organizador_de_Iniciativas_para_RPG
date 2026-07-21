using IniciativasRPG.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace IniciativasRPG.Api.Hubs;

public class BattleHub : Hub
{
    private readonly IBattleService _battleService;

    public BattleHub(IBattleService battleService)
    {
        _battleService = battleService;
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
    }
}
