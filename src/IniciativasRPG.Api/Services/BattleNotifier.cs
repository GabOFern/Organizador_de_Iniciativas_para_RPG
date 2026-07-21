using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace IniciativasRPG.Api.Services;

public interface IBattleNotifier
{
    Task NotifyBattleUpdatedAsync(BattleSnapshotDto snapshot, CancellationToken ct = default);
}

public class BattleNotifier : IBattleNotifier
{
    public const string BattleUpdatedEvent = "BattleUpdated";

    private readonly IHubContext<BattleHub> _hub;

    public BattleNotifier(IHubContext<BattleHub> hub)
    {
        _hub = hub;
    }

    public async Task NotifyBattleUpdatedAsync(BattleSnapshotDto snapshot, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(snapshot.PublicToken))
        {
            return;
        }

        await _hub.Clients
            .Group(BattleHub.GroupName(snapshot.PublicToken))
            .SendAsync(BattleUpdatedEvent, snapshot, ct);
    }
}
