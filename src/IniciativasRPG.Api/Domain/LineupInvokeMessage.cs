namespace IniciativasRPG.Api.Domain;

public readonly record struct LineupInvokeAdded(string Name, int Initiative);

public static class LineupInvokeMessage
{
    public static string Format(
        string sceneName,
        IReadOnlyList<LineupInvokeAdded> added,
        IReadOnlyList<string> alreadyIn)
    {
        var entered = added.Count == 0
            ? "ninguém entrou"
            : string.Join(", ", added.Select(item => $"{item.Name} {item.Initiative}"));
        var text = $"Cena {sceneName}: {entered}.";
        if (alreadyIn.Count > 0)
        {
            text += " Já na fila: " + string.Join(", ", alreadyIn) + ".";
        }

        return text;
    }
}
