namespace IniciativasRPG.Api.Domain;

public static class ModifierIconKeys
{
    public const string Default = "generic";

    public static readonly IReadOnlySet<string> Allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "generic",
        "poison",
        "fire",
        "frost",
        "bleed",
        "stun",
        "shield_up",
        "shield_down",
        "holy",
        "shadow",
        "regen"
    };

    public static bool IsAllowed(string? key) =>
        !string.IsNullOrWhiteSpace(key) && Allowed.Contains(key.Trim());
}
