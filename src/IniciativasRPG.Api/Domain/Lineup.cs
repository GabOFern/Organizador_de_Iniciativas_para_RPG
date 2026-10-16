namespace IniciativasRPG.Api.Domain;

public class Lineup
{
    public Guid Id { get; set; }
    public Guid CampaignId { get; set; }
    public Campaign Campaign { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<LineupMember> Members { get; set; } = new List<LineupMember>();
}
