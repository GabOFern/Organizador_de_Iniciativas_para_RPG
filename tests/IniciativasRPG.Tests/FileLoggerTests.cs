using FluentAssertions;
using IniciativasRPG.Api.Configuration;
using IniciativasRPG.Api.Logging;
using IniciativasRPG.Tests.Helpers;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace IniciativasRPG.Tests;

public class FileLoggerTests
{
    [Fact]
    public void Write_Info_CreatesFileInTestRunDirectory()
    {
        TestLogFiles.WithLogFile("file-logger-b2.log", path =>
        {
            var directory = Path.GetDirectoryName(path)!;
            var prefix = Path.GetFileNameWithoutExtension(path);

            using var provider = CreateProvider(directory, prefix);
            var logger = provider.CreateLogger("IniciativasRPG.Tests");
            logger.LogInformation("mensagem de teste do file logger");

            var expectedFile = Path.Combine(directory, $"{prefix}-{DateTime.Now:yyyyMMdd}.log");
            File.Exists(expectedFile).Should().BeTrue();
            var content = File.ReadAllText(expectedFile);
            content.Should().Contain("mensagem de teste do file logger");
            content.Should().Contain("[INFO]");

            // O helper apaga `path`; o provider escreve com prefixo+data.
            // Copiamos para `path` para o cleanup padrão e removemos o arquivo do dia.
            File.Copy(expectedFile, path, overwrite: true);
            File.Delete(expectedFile);
        });
    }

    [Fact]
    public void Cleanup_OnSuccess_RemovesArtifact()
    {
        var fileName = "file-logger-b3.log";
        var fullPath = TestLogFiles.PathFor(fileName);

        TestLogFiles.WithLogFile(fileName, path =>
        {
            File.WriteAllText(path, "temp");
            File.Exists(path).Should().BeTrue();
        });

        File.Exists(fullPath).Should().BeFalse();
    }

    [Fact]
    public void Cleanup_OnFailure_RetainsArtifact()
    {
        var fileName = "file-logger-retain.log";
        var fullPath = TestLogFiles.PathFor(fileName);

        var act = () => TestLogFiles.WithLogFile(fileName, path =>
        {
            File.WriteAllText(path, "retain-me");
            true.Should().BeFalse("forçando falha para reter o log");
        });

        act.Should().Throw<Exception>();
        File.Exists(fullPath).Should().BeTrue();
        File.Delete(fullPath);
    }

    private static FileLoggerProvider CreateProvider(string directory, string fileNamePrefix)
    {
        var options = Options.Create(new FileLoggingOptions
        {
            Enabled = true,
            Directory = directory,
            FileNamePrefix = fileNamePrefix,
        });
        var monitor = new StaticOptionsMonitor(options.Value);
        var env = new FakeHostEnvironment(directory);
        return new FileLoggerProvider(monitor, env);
    }

    private sealed class StaticOptionsMonitor : IOptionsMonitor<FileLoggingOptions>
    {
        public StaticOptionsMonitor(FileLoggingOptions current) => CurrentValue = current;
        public FileLoggingOptions CurrentValue { get; }
        public FileLoggingOptions Get(string? name) => CurrentValue;
        public IDisposable OnChange(Action<FileLoggingOptions, string?> listener) => NullDisposable.Instance;
    }

    private sealed class NullDisposable : IDisposable
    {
        public static readonly NullDisposable Instance = new();
        public void Dispose() { }
    }

    private sealed class FakeHostEnvironment : IHostEnvironment
    {
        public FakeHostEnvironment(string contentRoot) => ContentRootPath = contentRoot;
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "Tests";
        public string ContentRootPath { get; set; }
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
