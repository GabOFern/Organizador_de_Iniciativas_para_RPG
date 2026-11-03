using System.Text.Json;
using FluentAssertions;

namespace IniciativasRPG.Tests;

public class ApiAppsettingsCorsTests
{
    [Fact]
    public void AppsettingsJson_VersionedDefaults_IncludesLocalhostOriginAndWildcardHosts()
    {
        var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
        var path = Path.Combine(repoRoot, "src", "IniciativasRPG.Api", "appsettings.json");

        File.Exists(path).Should().BeTrue($"appsettings.json esperado em {path}");

        using var document = JsonDocument.Parse(File.ReadAllText(path));
        var root = document.RootElement;

        var origins = root.GetProperty("Cors")
            .GetProperty("AllowedOrigins")
            .EnumerateArray()
            .Select(origin => origin.GetString())
            .ToArray();

        origins.Should().Contain("http://localhost:5173");
        root.GetProperty("AllowedHosts").GetString().Should().Be("*");
    }
}
