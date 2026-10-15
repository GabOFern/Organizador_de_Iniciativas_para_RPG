namespace IniciativasRPG.Api.Domain;

public enum SheetFeatureKind
{
    Trait,
    Resistance,
    Immunity,
    Vulnerability,
    Sense,
    Speed,
    DifficultyClass,
    Legendary,
    Note
}

public static class SheetFeatureRules
{
    public const int MaxTitleLength = 120;
    public const int MaxTextLength = 1000;
}
