using FluentAssertions;
using IniciativasRPG.Api.Services;

namespace IniciativasRPG.Tests;

public class DiceServiceTests
{
    private readonly DiceService _sut = new();

    [Theory]
    [InlineData("1d20", true)]
    [InlineData("2d6+3", true)]
    [InlineData("1d8-1", true)]
    [InlineData("10d10", true)]
    [InlineData("1d20+0", true)]
    [InlineData("", false)]
    [InlineData("abc", false)]
    [InlineData("0d6", false)]
    [InlineData("1d1", false)]
    [InlineData("d20", false)]
    [InlineData("1d", false)]
    public void IsValidNotation_ReturnsExpected(string notation, bool expected)
    {
        _sut.IsValidNotation(notation).Should().Be(expected);
    }

    [Fact]
    public void Roll_ValidNotation_ReturnsWithinRange()
    {
        // 1d6+0 → entre 1 e 6
        for (var i = 0; i < 50; i++)
        {
            var result = _sut.Roll("1d6");
            result.Should().BeInRange(1, 6);
        }
    }

    [Fact]
    public void Roll_WithPositiveModifier_AddsToResult()
    {
        for (var i = 0; i < 50; i++)
        {
            var result = _sut.Roll("1d6+3");
            result.Should().BeInRange(4, 9);
        }
    }

    [Fact]
    public void Roll_WithNegativeModifier_SubtractsFromResult()
    {
        for (var i = 0; i < 50; i++)
        {
            var result = _sut.Roll("1d6-1");
            result.Should().BeInRange(0, 5);
        }
    }

    [Fact]
    public void Roll_InvalidNotation_ThrowsDomainException()
    {
        var act = () => _sut.Roll("abc");
        act.Should().Throw<DomainException>();
    }
}
