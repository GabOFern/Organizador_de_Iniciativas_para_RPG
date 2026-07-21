using System.Text.RegularExpressions;
using IniciativasRPG.Api.Domain;

namespace IniciativasRPG.Api.Services;

public interface IDiceService
{
    int Roll(string notation);
}

public partial class DiceService : IDiceService
{
    private static readonly Regex DicePattern = DiceRegex();

    public int Roll(string notation)
    {
        if (string.IsNullOrWhiteSpace(notation))
        {
            throw new DomainException(DomainMessages.InvalidDiceNotation);
        }

        var match = DicePattern.Match(notation.Trim());
        if (!match.Success)
        {
            throw new DomainException(DomainMessages.InvalidDiceNotation);
        }

        var count = int.Parse(match.Groups["count"].Value);
        var sides = int.Parse(match.Groups["sides"].Value);
        var modifier = match.Groups["mod"].Success
            ? int.Parse(match.Groups["mod"].Value)
            : 0;

        if (count < 1 || sides < 2)
        {
            throw new DomainException(DomainMessages.InvalidDiceNotation);
        }

        var total = modifier;
        for (var i = 0; i < count; i++)
        {
            total += Random.Shared.Next(1, sides + 1);
        }

        return total;
    }

    [GeneratedRegex(@"^(?<count>\d+)d(?<sides>\d+)(?<mod>[+-]\d+)?$", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex DiceRegex();
}
