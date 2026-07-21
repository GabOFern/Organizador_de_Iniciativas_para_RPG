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
    public int BaseAc { get; set; }
    public int CurrentAc { get; set; }
    public bool IsDead { get; set; }
    public int SortOrder { get; set; }

    /// <summary>
    /// Quando true, a vida não é exposta no snapshot/link público.
    /// </summary>
    public bool HideHpFromPublic { get; set; }

    /// <summary>
    /// Indica se o combatente deve ser pulado nesta rodada (sincronizado a partir de ActiveModifiers).
    /// </summary>
    public bool HasSkipTurnEffectActive { get; set; }

    public ICollection<ActiveModifier> ActiveModifiers { get; set; } = new List<ActiveModifier>();
}
