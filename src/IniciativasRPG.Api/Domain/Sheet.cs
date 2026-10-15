namespace IniciativasRPG.Api.Domain;

public class Sheet
{
    public Guid Id { get; set; }
    public Guid CampaignId { get; set; }
    public Campaign Campaign { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    /// <summary>Ponto de foco horizontal da imagem (0–100). Default 50 = centro.</summary>
    public double ImageFocusX { get; set; } = 50;
    /// <summary>Ponto de foco vertical da imagem (0–100). Default 50 = centro.</summary>
    public double ImageFocusY { get; set; } = 50;

    /// <summary>Escala em relação ao preenchimento do card. 1 cobre o card.</summary>
    public double ImageScale { get; set; } = SheetRules.ImageScaleDefault;
    public SheetType Type { get; set; }
    public CharacterClass Class { get; set; } = CharacterClass.None;
    public int MaxHp { get; set; }
    public int CurrentHp { get; set; }
    public int BaseAc { get; set; }
    public int DexModifier { get; set; }
    public int InitiativeBonus { get; set; }
    public int ProficiencyBonus { get; set; } = SheetRules.DefaultProficiencyBonus;

    public int Strength { get; set; } = AbilityScores.DefaultScore;
    public int Dexterity { get; set; } = AbilityScores.DefaultScore;
    public int Constitution { get; set; } = AbilityScores.DefaultScore;
    public int Intelligence { get; set; } = AbilityScores.DefaultScore;
    public int Wisdom { get; set; } = AbilityScores.DefaultScore;
    public int Charisma { get; set; } = AbilityScores.DefaultScore;

    public string? Resistances { get; set; }

    public ICollection<Combatant> Combatants { get; set; } = new List<Combatant>();
    public ICollection<SheetFeature> Features { get; set; } = new List<SheetFeature>();
    public ICollection<SheetAttack> Attacks { get; set; } = new List<SheetAttack>();
    public ICollection<SheetSpell> Spells { get; set; } = new List<SheetSpell>();
    public ICollection<SheetWeapon> Weapons { get; set; } = new List<SheetWeapon>();
    public SheetImage? Image { get; set; }
}
