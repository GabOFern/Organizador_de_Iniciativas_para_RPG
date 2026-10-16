using FluentAssertions;
using IniciativasRPG.Api.Domain;

namespace IniciativasRPG.Tests;

public class LineupInvokeMessageTests
{
    [Fact]
    public void Format_ListaQuemEntrou()
    {
        var text = LineupInvokeMessage.Format(
            "Cemitério",
            [new LineupInvokeAdded("Esqueleto", 14), new LineupInvokeAdded("Tumular", 9)],
            []);

        text.Should().Be("Cena Cemitério: Esqueleto 14, Tumular 9.");
    }

    [Fact]
    public void Format_JogadorJaNaFila_ContinuaNaMensagem()
    {
        var text = LineupInvokeMessage.Format(
            "Jogadores",
            [new LineupInvokeAdded("Howl", 11)],
            ["Diana"]);

        text.Should().Be("Cena Jogadores: Howl 11. Já na fila: Diana.");
    }

    [Fact]
    public void Format_NinguemEntrou_SoListaQuemJaEstava()
    {
        var text = LineupInvokeMessage.Format("Jogadores", [], ["Diana", "Howl"]);

        text.Should().Be("Cena Jogadores: ninguém entrou. Já na fila: Diana, Howl.");
    }
}
