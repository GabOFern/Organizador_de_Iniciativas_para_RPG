using IniciativasRPG.Api.Services;

namespace IniciativasRPG.Tests.Helpers;

public sealed class FakeDiceService : IDiceService
{
    private readonly Queue<int> _rolls = new();
    private readonly DiceService _validator = new();

    public void Enqueue(params int[] rolls)
    {
        foreach (var roll in rolls)
        {
            _rolls.Enqueue(roll);
        }
    }

    public bool IsValidNotation(string notation) => _validator.IsValidNotation(notation);

    public int Roll(string notation)
    {
        if (!_validator.IsValidNotation(notation))
        {
            return _validator.Roll(notation);
        }

        if (_rolls.Count == 0)
        {
            throw new InvalidOperationException($"Nenhuma rolagem enfileirada para '{notation}'.");
        }

        return _rolls.Dequeue();
    }
}
