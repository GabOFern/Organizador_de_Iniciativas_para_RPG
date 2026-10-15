using FluentAssertions;
using IniciativasRPG.Api.Domain;

namespace IniciativasRPG.Tests;

public class AbilityScoresTests
{
    [Theory]
    [InlineData(10, 0)]
    [InlineData(1, -5)]
    [InlineData(20, 5)]
    [InlineData(30, 10)]
    [InlineData(11, 0)]
    [InlineData(9, -1)]
    [InlineData(8, -1)]
    [InlineData(7, -2)]
    public void Modifier_ReturnsFloorOfScoreMinusTenOverTwo(int score, int expected)
    {
        AbilityScores.Modifier(score).Should().Be(expected);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-5, 1)]
    [InlineData(1, 1)]
    [InlineData(15, 15)]
    [InlineData(30, 30)]
    [InlineData(35, 30)]
    public void Clamp_KeepsScoreBetweenMinAndMax(int input, int expected)
    {
        AbilityScores.Clamp(input).Should().Be(expected);
    }
}
