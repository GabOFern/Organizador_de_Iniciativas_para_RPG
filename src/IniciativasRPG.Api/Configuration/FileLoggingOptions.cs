namespace IniciativasRPG.Api.Configuration;

public class FileLoggingOptions
{
    public const string SectionName = "FileLogging";

    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Diretório relativo à raiz do monorepo (dois níveis acima do ContentRoot da API).
    /// </summary>
    public string Directory { get; set; } = "logs/back";

    public string FileNamePrefix { get; set; } = "api";
}
