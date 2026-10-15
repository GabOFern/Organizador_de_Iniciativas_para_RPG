using FluentAssertions;
using IniciativasRPG.Api.Domain;

namespace IniciativasRPG.Tests;

public class SongFocusSheetContentTests
{
    [Fact]
    public void SheetName_IsCanonicalFocus()
    {
        SongFocusSheetContent.SheetName.Should().Be("Foco da Canção");
    }

    [Fact]
    public void LegacyNames_HasExactlyThreeVariants()
    {
        SongFocusSheetContent.LegacyNames.Should().HaveCount(3);
        SongFocusSheetContent.LegacyNames.Should().Contain("Foco da Canção — Pavor");
        SongFocusSheetContent.LegacyNames.Should().Contain("Foco da Canção — Recomposição");
        SongFocusSheetContent.LegacyNames.Should().Contain("Foco da Canção — Ruína");
    }

    [Fact]
    public void Stats_AreFifteenAcAndThirtyHp()
    {
        SongFocusSheetContent.MaxHp.Should().Be(30);
        SongFocusSheetContent.BaseAc.Should().Be(15);
    }

    [Fact]
    public void Features_ContainAllThreeSongsAndSharedRules()
    {
        var titles = SongFocusSheetContent.Features.Select(f => f.Title).ToList();
        titles.Should().Contain("Ruína");
        titles.Should().Contain("Recomposição");
        titles.Should().Contain("Pavor");
        titles.Should().Contain("Silenciar");
        titles.Should().Contain("CD focal");

        var joined = string.Join(' ', SongFocusSheetContent.Features.Select(f => f.Text));
        joined.Should().Contain("3d8");
        joined.Should().Contain("15 PV");
        joined.Should().Contain("amedrontado");
        joined.Should().Contain("CD 16");
        joined.Should().Contain("invoque esta ficha até 3 vezes");
    }
}
