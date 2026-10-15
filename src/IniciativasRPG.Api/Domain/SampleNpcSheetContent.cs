namespace IniciativasRPG.Api.Domain;

/// <summary>
/// Únicas fichas genéricas criadas automaticamente pelo seed (batalhas rápidas).
/// </summary>
public static class SampleNpcSheetContent
{
    public sealed record SampleAttack(
        string Description,
        string DamageDice,
        AbilityName AbilityBase,
        StrikeType StrikeType);

    public sealed record SampleSheet(
        string Name,
        SheetType Type,
        int MaxHp,
        int BaseAc,
        int Strength,
        int Dexterity,
        int Constitution,
        int Intelligence,
        int Wisdom,
        int Charisma,
        int InitiativeBonus,
        SampleAttack Attack,
        string Note,
        string ArtFileName);

    public static readonly IReadOnlyList<SampleSheet> All =
    [
        new(
            Name: "Guarda da Cidade",
            Type: SheetType.Npc,
            MaxHp: 11,
            BaseAc: 16,
            Strength: 13,
            Dexterity: 12,
            Constitution: 12,
            Intelligence: 10,
            Wisdom: 11,
            Charisma: 10,
            InitiativeBonus: 0,
            Attack: new("Lança", "1d6", AbilityName.Strength, StrikeType.Melee),
            Note: "NPC genérico de patrulha. Útil como reforço urbano.",
            ArtFileName: "guarda-cidade.jpg"),
        new(
            Name: "Guarda Veterano",
            Type: SheetType.Npc,
            MaxHp: 22,
            BaseAc: 17,
            Strength: 15,
            Dexterity: 12,
            Constitution: 14,
            Intelligence: 10,
            Wisdom: 12,
            Charisma: 10,
            InitiativeBonus: 0,
            Attack: new("Espada longa", "1d8", AbilityName.Strength, StrikeType.Melee),
            Note: "NPC genérico mais resistente. Capitão de guarda ou sargento.",
            ArtFileName: "guarda-veterano.jpg"),
        new(
            Name: "Bandido",
            Type: SheetType.Npc,
            MaxHp: 11,
            BaseAc: 12,
            Strength: 11,
            Dexterity: 14,
            Constitution: 12,
            Intelligence: 10,
            Wisdom: 10,
            Charisma: 10,
            InitiativeBonus: 0,
            Attack: new("Cimitarra", "1d6", AbilityName.Dexterity, StrikeType.Melee),
            Note: "NPC genérico de emboscada ou rua.",
            ArtFileName: "bandido.jpg"),
        new(
            Name: "Goblin",
            Type: SheetType.Creature,
            MaxHp: 7,
            BaseAc: 15,
            Strength: 8,
            Dexterity: 14,
            Constitution: 10,
            Intelligence: 10,
            Wisdom: 8,
            Charisma: 8,
            InitiativeBonus: 0,
            Attack: new("Cimitarra", "1d6", AbilityName.Dexterity, StrikeType.Melee),
            Note: "Criatura básica frágil. Bom para hordas.",
            ArtFileName: "goblin.jpg"),
        new(
            Name: "Esqueleto",
            Type: SheetType.Creature,
            MaxHp: 13,
            BaseAc: 13,
            Strength: 10,
            Dexterity: 14,
            Constitution: 15,
            Intelligence: 6,
            Wisdom: 8,
            Charisma: 5,
            InitiativeBonus: 0,
            Attack: new("Espada curta", "1d6", AbilityName.Dexterity, StrikeType.Melee),
            Note: "Mortos-vivos básicos. Vulnerável a dano de esmagamento (narrativo).",
            ArtFileName: "esqueleto.jpg"),
        new(
            Name: "Lobo",
            Type: SheetType.Creature,
            MaxHp: 11,
            BaseAc: 13,
            Strength: 12,
            Dexterity: 15,
            Constitution: 12,
            Intelligence: 3,
            Wisdom: 12,
            Charisma: 6,
            InitiativeBonus: 0,
            Attack: new("Mordida", "2d4", AbilityName.Strength, StrikeType.Melee),
            Note: "Predador básico de floresta ou planície.",
            ArtFileName: "lobo.jpg"),
    ];

    public static readonly IReadOnlyList<string> Names =
        All.Select(s => s.Name).ToArray();

    public static bool IsSampleName(string name) =>
        Names.Contains(name, StringComparer.Ordinal);
}
