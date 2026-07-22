namespace IniciativasRPG.Api.Domain;

public static class AbilityScores
{
    public const int DefaultScore = 10;
    public const int MinScore = 1;
    public const int MaxScore = 30;

    public static int Modifier(int score) =>
        (int)Math.Floor((Clamp(score) - 10) / 2.0);

    public static int Clamp(int score) =>
        Math.Clamp(score, MinScore, MaxScore);
}
