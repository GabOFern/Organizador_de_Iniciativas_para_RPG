namespace IniciativasRPG.Api.Logging;

public static class LogLineFormatter
{
    public static string Format(DateTimeOffset timestamp, string level, string text)
    {
        var local = timestamp.ToLocalTime();
        var ts = local.ToString("yyyy-MM-dd HH:mm:ss.fff");
        return $"[{ts}] [{level}] - {text}";
    }

    public static string NormalizeLevel(LogLevel level) => level switch
    {
        LogLevel.Trace => "DEBUG",
        LogLevel.Debug => "DEBUG",
        LogLevel.Information => "INFO",
        LogLevel.Warning => "WARN",
        LogLevel.Error => "ERROR",
        LogLevel.Critical => "ERROR",
        _ => "INFO",
    };
}
