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

    public static string GroupName(string publicToken) => $"battle:{publicToken}";

    [AllowAnonymous]
    public async Task JoinBattle(string publicToken)
    {
        if (string.IsNullOrWhiteSpace(publicToken))
        {
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(publicToken));
        var snapshot = await _battleService.GetByPublicTokenAsync(publicToken);
        await Clients.Caller.SendAsync(BattleNotifier.BattleUpdatedEvent, snapshot);
    }
}
