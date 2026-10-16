using FluentAssertions;
using IniciativasRPG.Api.Domain;

namespace IniciativasRPG.Tests;

public class AttackResolutionTests
{
    [Theory]
    [InlineData(2, 2, 4)]
    [InlineData(2, -1, 1)]
    [InlineData(0, 3, 3)]
    public void HitBonus_SumsProficiencyAndAbility(int proficiency, int abilityMod, int expected)
    {
        AttackResolution.HitBonus(proficiency, abilityMod).Should().Be(expected);
    }

    [Fact]
    public void DoesHit_NaturalOne_AlwaysMisses()
    {
        AttackResolution.DoesHit(1, 20, 5).Should().BeFalse();
    }

    [Fact]
    public void DoesHit_NaturalTwenty_AlwaysHits()
    {
        AttackResolution.DoesHit(20, 0, 30).Should().BeTrue();
    }

    [Theory]
    [InlineData(14, 4, 17, true)]
    [InlineData(12, 4, 17, false)]
    [InlineData(15, 2, 17, true)]
    public void DoesHit_ComparesTotalAgainstAc(int natural, int bonus, int ac, bool expected)
    {
        AttackResolution.DoesHit(natural, bonus, ac).Should().Be(expected);
    }

    [Fact]
    public void DamageTotal_AppliesAbilityAndMinimumOne()
    {
        AttackResolution.DamageTotal(4, 2).Should().Be(6);
        AttackResolution.DamageTotal(1, -3).Should().Be(1);
    }

    [Fact]
    public void AbilityScoreOf_ReturnsMatchingScore()
    {
        var sheet = new Sheet
        {
            Strength = 15,
            Dexterity = 14,
            Constitution = 12,
            Intelligence = 10,
            Wisdom = 8,
            Charisma = 6,
        };

        AttackResolution.AbilityScoreOf(sheet, AbilityName.Strength).Should().Be(15);
        AttackResolution.AbilityScoreOf(sheet, AbilityName.Dexterity).Should().Be(14);
        AttackResolution.AbilityScoreOf(sheet, AbilityName.Wisdom).Should().Be(8);
    }
}
