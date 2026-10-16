namespace IniciativasRPG.Api.Domain;

public static class AttackResolution
{
    public const int NaturalMiss = 1;
    public const int NaturalHit = 20;

    public static int HitBonus(int proficiencyBonus, int abilityModifier) =>
        proficiencyBonus + abilityModifier;

    public static bool DoesHit(int naturalD20, int hitBonus, int targetAc)
    {
        if (naturalD20 <= NaturalMiss)
        {
            return false;
        }

        if (naturalD20 >= NaturalHit)
        {
            return true;
        }

        return naturalD20 + hitBonus >= targetAc;
    }

    public static int TotalToHit(int naturalD20, int hitBonus) => naturalD20 + hitBonus;

    public static int DamageTotal(int diceRoll, int abilityModifier) =>
        Math.Max(1, diceRoll + abilityModifier);

    public static int AbilityScoreOf(Sheet sheet, AbilityName ability) =>
        ability switch
        {
            AbilityName.Strength => sheet.Strength,
            AbilityName.Dexterity => sheet.Dexterity,
            AbilityName.Constitution => sheet.Constitution,
            AbilityName.Intelligence => sheet.Intelligence,
            AbilityName.Wisdom => sheet.Wisdom,
            AbilityName.Charisma => sheet.Charisma,
            _ => sheet.Strength,
        };
}
