namespace IniciativasRPG.Api.Domain;

public class Combatant
{
    public Guid Id { get; set; }
    public Guid BattleId { get; set; }
    public Battle Battle { get; set; } = null!;
    public Guid SheetId { get; set; }
    public Sheet Sheet { get; set; } = null!;
    public int Initiative { get; set; }
    public int CurrentHp { get; set; }
    public int MaxHp { get; set; }
    public int CurrentAc { get; set; }
    public bool IsDead { get; set; }
    public int SortOrder { get; set; }

    /// <summary>
    /// Fase 2: combatentes com modificador "pula turno" ativo serão ignorados.
    /// </summary>
    public bool HasSkipTurnEffectActive { get; set; }
}
