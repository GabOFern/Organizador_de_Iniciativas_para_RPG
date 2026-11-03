using FluentAssertions;
using IniciativasRPG.Api.Domain;

namespace IniciativasRPG.Tests;

public class DemoBattleRulesTests
{
    [Fact]
    public void DemoBattleSheetsMissing_ContainsEachRequiredSheetName()
    {
        var message = DomainMessages.DemoBattleSheetsMissing;
        var names = DemoBattleRules.RequiredSheetNames;

        names.Should().Equal("Guarda Veterano", "Goblin", "Lobo");
        foreach (var name in names)
        {
            message.Should().Contain(name);
        }

        message.Should().Be(
            "Não foi possível iniciar a batalha teste: faltam as fichas Guarda Veterano, Goblin e Lobo nesta campanha.");
    }
}
