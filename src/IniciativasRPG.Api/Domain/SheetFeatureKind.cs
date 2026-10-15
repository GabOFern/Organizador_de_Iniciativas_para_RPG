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
    Note,
    Annotation
}

public static class SheetFeatureRules
{
    public const int MaxTitleLength = 120;
    public const int MaxTextLength = 1000;
    public const int MaxAnnotationTextLength = 8000;

    public static int TextLimit(SheetFeatureKind kind) =>
        kind == SheetFeatureKind.Annotation ? MaxAnnotationTextLength : MaxTextLength;
}
