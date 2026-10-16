using IniciativasRPG.Api.Services;

namespace IniciativasRPG.Tests.Helpers;

public sealed class FakeDemoBattleRandom : IDemoBattleRandom
{
    private readonly Queue<int> _percents = new();
    private readonly Queue<int> _indices = new();

    public void EnqueuePercent(params int[] values)
    {
        foreach (var value in values)
        {
            _percents.Enqueue(value);
        }
    }

    public void EnqueueIndex(params int[] values)
    {
        foreach (var value in values)
        {
            _indices.Enqueue(value);
        }
    }

    public int NextPercent()
    {
        if (_percents.Count == 0)
        {
            return 99;
        }

        return _percents.Dequeue();
    }

    public int NextIndex(int count)
    {
        if (count <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(count));
        }

        if (_indices.Count == 0)
        {
            return 0;
        }

        var index = _indices.Dequeue();
        return Math.Clamp(index, 0, count - 1);
    }
}
