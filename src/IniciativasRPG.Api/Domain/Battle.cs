namespace IniciativasRPG.Api.Domain;

public class Battle
{
    public Guid Id { get; set; }
    public string PublicToken { get; set; } = string.Empty;
    public BattleStatus Status { get; set; } = BattleStatus.Preparing;
    public int CurrentTurnIndex { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? PlayerStatsSavedAtUtc { get; set; }

    public ICollection<Combatant> Combatants { get; set; } = new List<Combatant>();
}
