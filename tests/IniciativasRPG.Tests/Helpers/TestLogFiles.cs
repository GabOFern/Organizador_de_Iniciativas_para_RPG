namespace IniciativasRPG.Tests.Helpers;

/// <summary>
/// Artefatos de log de teste: removidos se o teste passar; retidos se falhar.
/// </summary>
public static class TestLogFiles
{
    public static string BackTestRunDirectory
    {
        get
        {
            var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
            return Path.Combine(repoRoot, "logs", "back", "test-run");
        }
    }

    public static string PathFor(string fileName) =>
        Path.Combine(BackTestRunDirectory, fileName);

    public static async Task WithLogFileAsync(string fileName, Func<string, Task> action)
    {
        var path = PathFor(fileName);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        if (File.Exists(path))
        {
            File.Delete(path);
        }

        try
        {
            await action(path);
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
        catch
        {
            throw;
        }
    }

    public static void WithLogFile(string fileName, Action<string> action)
    {
        WithLogFileAsync(fileName, path =>
        {
            action(path);
            return Task.CompletedTask;
        }).GetAwaiter().GetResult();
    }
}
