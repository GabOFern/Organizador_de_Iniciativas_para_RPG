using System.Collections.Concurrent;
using IniciativasRPG.Api.Configuration;
using Microsoft.Extensions.Options;

namespace IniciativasRPG.Api.Logging;

public sealed class FileLoggerProvider : ILoggerProvider
{
    private readonly IOptionsMonitor<FileLoggingOptions> _options;
    private readonly string _contentRoot;
    private readonly ConcurrentDictionary<string, FileLogger> _loggers = new();
    private readonly object _writeLock = new();

    public FileLoggerProvider(IOptionsMonitor<FileLoggingOptions> options, IHostEnvironment environment)
    {
        _options = options;
        _contentRoot = environment.ContentRootPath;
    }

    public ILogger CreateLogger(string categoryName) =>
        _loggers.GetOrAdd(categoryName, name => new FileLogger(name, this));

    internal void WriteLine(string line)
    {
        var opts = _options.CurrentValue;
        if (!opts.Enabled)
        {
            return;
        }

        var directory = ResolveDirectory(opts.Directory);
        Directory.CreateDirectory(directory);
        var fileName = $"{opts.FileNamePrefix}-{DateTime.Now:yyyyMMdd}.log";
        var path = Path.Combine(directory, fileName);

        lock (_writeLock)
        {
            File.AppendAllText(path, line + Environment.NewLine);
        }
    }

    public string ResolveDirectory(string configured)
    {
        if (Path.IsPathRooted(configured))
        {
            return configured;
        }

        // ContentRoot = src/IniciativasRPG.Api → raiz do monorepo = ../..
        var repoRoot = Path.GetFullPath(Path.Combine(_contentRoot, "..", ".."));
        return Path.GetFullPath(Path.Combine(repoRoot, configured));
    }

    public void Dispose() => _loggers.Clear();

    private sealed class FileLogger : ILogger
    {
        private readonly string _category;
        private readonly FileLoggerProvider _provider;

        public FileLogger(string category, FileLoggerProvider provider)
        {
            _category = category;
            _provider = provider;
        }

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) =>
            logLevel != LogLevel.None && _provider._options.CurrentValue.Enabled;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            if (!IsEnabled(logLevel))
            {
                return;
            }

            var text = formatter(state, exception);
            if (exception is not null)
            {
                text = $"{text} | {exception.GetType().Name}: {exception.Message}";
            }

            if (!string.IsNullOrWhiteSpace(_category) && !_category.StartsWith("IniciativasRPG", StringComparison.Ordinal))
            {
                text = $"{_category}: {text}";
            }

            var level = LogLineFormatter.NormalizeLevel(logLevel);
            var line = LogLineFormatter.Format(DateTimeOffset.Now, level, text);
            Console.WriteLine(line);
            _provider.WriteLine(line);
        }
    }
}

public static class FileLoggerExtensions
{
    public static ILoggingBuilder AddFileLogger(this ILoggingBuilder builder)
    {
        builder.Services.AddSingleton<ILoggerProvider, FileLoggerProvider>();
        return builder;
    }
}
