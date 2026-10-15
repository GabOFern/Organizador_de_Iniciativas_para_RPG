using System.Text.RegularExpressions;
using FluentAssertions;
using IniciativasRPG.Api.Logging;
using Microsoft.Extensions.Logging;

namespace IniciativasRPG.Tests;

public class LogLineFormatterTests
{
    private static readonly Regex LinePattern = new(
        @"^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[(DEBUG|INFO|WARN|ERROR)\] - .+$",
        RegexOptions.Compiled);

    [Fact]
    public void Format_ValidInput_MatchesStandardPattern()
    {
        var timestamp = new DateTimeOffset(2026, 10, 15, 19, 5, 30, 123, TimeSpan.FromHours(-3));
        var line = LogLineFormatter.Format(timestamp, "ERROR", "algo falhou");

        line.Should().MatchRegex(LinePattern);
        line.Should().Contain("algo falhou");
        line.Should().Contain("[ERROR]");
    }

    [Theory]
    [InlineData(LogLevel.Debug, "DEBUG")]
    [InlineData(LogLevel.Information, "INFO")]
    [InlineData(LogLevel.Warning, "WARN")]
    [InlineData(LogLevel.Error, "ERROR")]
    public void NormalizeLevel_MapsToShortNames(LogLevel level, string expected)
    {
        LogLineFormatter.NormalizeLevel(level).Should().Be(expected);
    }
}
