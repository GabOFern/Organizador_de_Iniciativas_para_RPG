using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace IniciativasRPG.Api.Services;

public interface IBattleNotifier
{
    Task NotifyBattleUpdatedAsync(
        string publicToken,
        BattleSnapshotDto? masterSnapshot = null,
        CancellationToken ct = default);

    Task NotifyScenesUpdatedAsync(string publicToken, CancellationToken ct = default);
}

public class BattleNotifier : IBattleNotifier
{
    public const string BattleUpdatedEvent = "BattleUpdated";
    public const string ScenesUpdatedEvent = "ScenesUpdated";

    private readonly IHubContext<BattleHub> _hub;
    private readonly IServiceScopeFactory _scopeFactory;

    public BattleNotifier(IHubContext<BattleHub> hub, IServiceScopeFactory scopeFactory)
    {
        _hub = hub;
        _scopeFactory = scopeFactory;
    }

    public async Task NotifyBattleUpdatedAsync(
        string publicToken,
        BattleSnapshotDto? masterSnapshot = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(publicToken))
        {
            return;
        }

        await using var scope = _scopeFactory.CreateAsyncScope();
        var battleService = scope.ServiceProvider.GetRequiredService<IBattleService>();

        var master = masterSnapshot
            ?? await battleService.GetByPublicTokenAsync(publicToken, forPublic: false, ct);
        var publicSnapshot = await battleService.GetByPublicTokenAsync(publicToken, forPublic: true, ct);

        await _hub.Clients
            .Group(BattleHub.MasterGroupName(publicToken))
            .SendAsync(BattleUpdatedEvent, master, ct);

        await _hub.Clients
            .Group(BattleHub.PublicGroupName(publicToken))
            .SendAsync(BattleUpdatedEvent, publicSnapshot, ct);
    }

    public async Task NotifyScenesUpdatedAsync(string publicToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(publicToken))
        {
            return;
        }

        await using var scope = _scopeFactory.CreateAsyncScope();
        var sceneService = scope.ServiceProvider.GetRequiredService<ISceneService>();

        IReadOnlyList<CampaignSceneDto> masterScenes;
        IReadOnlyList<CampaignSceneDto> publicScenes;
        try
        {
            masterScenes = await sceneService.ListMasterByPublicTokenAsync(publicToken, ct);
            publicScenes = await sceneService.ListByPublicTokenAsync(publicToken, ct);
        }
        catch (DomainException)
        {
            masterScenes = Array.Empty<CampaignSceneDto>();
            publicScenes = Array.Empty<CampaignSceneDto>();
        }

        await _hub.Clients
            .Group(BattleHub.MasterGroupName(publicToken))
            .SendAsync(ScenesUpdatedEvent, masterScenes, ct);

        await _hub.Clients
            .Group(BattleHub.PublicGroupName(publicToken))
            .SendAsync(ScenesUpdatedEvent, publicScenes, ct);
    }
}
