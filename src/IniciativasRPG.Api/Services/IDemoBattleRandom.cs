namespace IniciativasRPG.Api.Services;

public interface IDemoBattleRandom
{
    /// <summary>Returns 0..99 inclusive.</summary>
    int NextPercent();

    /// <summary>Returns index in [0, count).</summary>
    int NextIndex(int count);
}

public sealed class DemoBattleRandom : IDemoBattleRandom
{
    public int NextPercent() => Random.Shared.Next(0, 100);

    public int NextIndex(int count)
    {
        if (count <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(count));
        }

        return Random.Shared.Next(0, count);
    }
}
