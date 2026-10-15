using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Services;

namespace IniciativasRPG.Tests.Helpers;

public sealed class FakeBattleNotifier : IBattleNotifier
{
    public int ScenesNotifyCount { get; private set; }
    public string? LastScenesToken { get; private set; }

    public Task NotifyBattleUpdatedAsync(
        string publicToken,
        BattleSnapshotDto? masterSnapshot = null,
        CancellationToken ct = default) =>
        Task.CompletedTask;

    public Task NotifyScenesUpdatedAsync(string publicToken, CancellationToken ct = default)
    {
        ScenesNotifyCount++;
        LastScenesToken = publicToken;
        return Task.CompletedTask;
    }
}
