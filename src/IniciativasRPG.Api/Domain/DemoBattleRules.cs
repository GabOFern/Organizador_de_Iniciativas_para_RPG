namespace IniciativasRPG.Api.Domain;

public static class DemoBattleRules
{
    public const int TickIntervalSeconds = 5;
    public const int HealChancePercent = 15;
    public const string HealDice = "1d4";
    public const string AttackDice = "1d20";

    public static readonly IReadOnlyList<string> RequiredSheetNames =
    [
        "Guarda Veterano",
        "Goblin",
        "Lobo",
    ];

    public static string StartedMessage() =>
        $"Batalha teste iniciada. Turnos automáticos a cada {TickIntervalSeconds}s.";

    public static string HitMessage(
        string attacker,
        string target,
        string attackName,
        int totalToHit,
        int targetAc,
        int damage) =>
        $"{attacker} ataca {target} com {attackName}: {totalToHit} vs CA {targetAc} — acerto, {damage} de dano.";

    public static string MissMessage(
        string attacker,
        string target,
        string attackName,
        int totalToHit,
        int targetAc) =>
        $"{attacker} ataca {target} com {attackName}: {totalToHit} vs CA {targetAc} — errou.";

    public static string KillSuffix(string targetName) =>
        $" {targetName} cai a 0 PV e morre.";

    public static string HealMessage(string actorName, int amount) =>
        $"{actorName} recupera {amount} PV.";

    public static string FinishedMessage(string winnerName) =>
        $"Batalha teste encerrada. Vencedor: {winnerName}.";

    public static string RestartedMessage(string winnerName) =>
        $"Vencedor: {winnerName}. Nova rodada iniciada — turnos a cada {TickIntervalSeconds}s.";
}
