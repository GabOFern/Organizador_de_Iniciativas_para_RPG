using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Services;

public interface ILineupService
{
    Task<IReadOnlyList<LineupDto>> ListAsync(Guid campaignId, CancellationToken ct = default);
    Task<LineupDto> GetAsync(Guid campaignId, Guid lineupId, CancellationToken ct = default);
    Task<LineupDto> CreateAsync(Guid campaignId, SaveLineupRequest request, CancellationToken ct = default);
    Task<LineupDto> UpdateAsync(Guid campaignId, Guid lineupId, SaveLineupRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid campaignId, Guid lineupId, CancellationToken ct = default);
}

public class LineupService : ILineupService
{
    private readonly AppDbContext _db;

    public LineupService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<LineupDto>> ListAsync(Guid campaignId, CancellationToken ct = default)
    {
        var lineups = await _db.Lineups
            .AsNoTracking()
            .Include(l => l.Members)
            .ThenInclude(m => m.Sheet)
            .Where(l => l.CampaignId == campaignId)
            .OrderBy(l => l.Name)
            .ToListAsync(ct);

        return lineups.Select(Map).ToList();
    }

    public async Task<LineupDto> GetAsync(Guid campaignId, Guid lineupId, CancellationToken ct = default)
    {
        var lineup = await LoadAsync(campaignId, lineupId, tracking: false, ct);
        return Map(lineup);
    }

    public async Task<LineupDto> CreateAsync(Guid campaignId, SaveLineupRequest request, CancellationToken ct = default)
    {
        var name = NormalizeName(request.Name);
        var members = await NormalizeMembersAsync(campaignId, request.Members, ct);

        var lineup = new Lineup
        {
            Id = Guid.NewGuid(),
            CampaignId = campaignId,
            Name = name,
            CreatedAtUtc = DateTime.UtcNow,
        };
        AddMembers(lineup, members);
        _db.Lineups.Add(lineup);
        await _db.SaveChangesAsync(ct);

        return await GetAsync(campaignId, lineup.Id, ct);
    }

    public async Task<LineupDto> UpdateAsync(
        Guid campaignId,
        Guid lineupId,
        SaveLineupRequest request,
        CancellationToken ct = default)
    {
        var name = NormalizeName(request.Name);
        var members = await NormalizeMembersAsync(campaignId, request.Members, ct);

        var lineup = await _db.Lineups
            .Include(l => l.Members)
            .FirstOrDefaultAsync(l => l.Id == lineupId && l.CampaignId == campaignId, ct)
            ?? throw new DomainException(DomainMessages.LineupNotFound, StatusCodes.Status404NotFound);

        lineup.Name = name;
        _db.LineupMembers.RemoveRange(lineup.Members.ToList());
        for (var i = 0; i < members.Count; i++)
        {
            _db.LineupMembers.Add(new LineupMember
            {
                Id = Guid.NewGuid(),
                LineupId = lineup.Id,
                SheetId = members[i].SheetId,
                Quantity = members[i].Quantity,
                SortOrder = i,
            });
        }

        await _db.SaveChangesAsync(ct);
        return await GetAsync(campaignId, lineup.Id, ct);
    }

    public async Task DeleteAsync(Guid campaignId, Guid lineupId, CancellationToken ct = default)
    {
        var lineup = await LoadAsync(campaignId, lineupId, tracking: true, ct);
        _db.Lineups.Remove(lineup);
        await _db.SaveChangesAsync(ct);
    }

    private async Task<Lineup> LoadAsync(Guid campaignId, Guid lineupId, bool tracking, CancellationToken ct)
    {
        var query = _db.Lineups.Include(l => l.Members).ThenInclude(m => m.Sheet).AsQueryable();
        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        return await query.FirstOrDefaultAsync(l => l.Id == lineupId && l.CampaignId == campaignId, ct)
            ?? throw new DomainException(DomainMessages.LineupNotFound, StatusCodes.Status404NotFound);
    }

    private static string NormalizeName(string? name)
    {
        var trimmed = name?.Trim() ?? string.Empty;
        if (trimmed.Length == 0)
        {
            throw new DomainException(DomainMessages.LineupNameRequired);
        }

        if (trimmed.Length > LineupRules.MaxNameLength)
        {
            throw new DomainException(DomainMessages.LineupNameTooLong);
        }

        return trimmed;
    }

    private async Task<IReadOnlyList<MemberDraft>> NormalizeMembersAsync(
        Guid campaignId,
        IReadOnlyList<SaveLineupMemberRequest>? members,
        CancellationToken ct)
    {
        var raw = members ?? [];
        if (raw.Any(member => member.Quantity < 0))
        {
            throw new DomainException(DomainMessages.LineupQuantityInvalid);
        }

        var chosen = raw.Where(member => member.Quantity > 0).ToList();
        if (chosen.Count < LineupRules.MinMembers)
        {
            throw new DomainException(DomainMessages.LineupNeedsMembers);
        }

        if (chosen.Select(member => member.SheetId).Distinct().Count() != chosen.Count)
        {
            throw new DomainException(DomainMessages.LineupDuplicateSheet);
        }

        var ids = chosen.Select(member => member.SheetId).ToList();
        var sheets = await _db.Sheets
            .AsNoTracking()
            .Where(sheet => sheet.CampaignId == campaignId && ids.Contains(sheet.Id))
            .Select(sheet => new { sheet.Id, sheet.Type })
            .ToListAsync(ct);

        if (sheets.Count != ids.Count)
        {
            throw new DomainException(DomainMessages.LineupSheetNotInCampaign);
        }

        var types = sheets.ToDictionary(sheet => sheet.Id, sheet => sheet.Type);
        foreach (var member in chosen)
        {
            var max = types[member.SheetId] == SheetType.Player
                ? LineupRules.MaxPlayerQuantity
                : LineupRules.MaxQuantity;
            if (member.Quantity < LineupRules.MinQuantity || member.Quantity > max)
            {
                throw new DomainException(DomainMessages.LineupQuantityInvalid);
            }
        }

        return chosen.Select(member => new MemberDraft(member.SheetId, member.Quantity)).ToList();
    }

    private static void AddMembers(Lineup lineup, IReadOnlyList<MemberDraft> members)
    {
        for (var i = 0; i < members.Count; i++)
        {
            lineup.Members.Add(new LineupMember
            {
                Id = Guid.NewGuid(),
                LineupId = lineup.Id,
                SheetId = members[i].SheetId,
                Quantity = members[i].Quantity,
                SortOrder = i,
            });
        }
    }

    private static LineupDto Map(Lineup lineup) =>
        new(
            lineup.Id,
            lineup.Name,
            lineup.Members
                .OrderBy(m => m.SortOrder)
                .Select(m => new LineupMemberDto(
                    m.SheetId,
                    m.Sheet.Name,
                    m.Sheet.Type.ToString(),
                    m.Sheet.InitiativeBonus,
                    m.Quantity,
                    m.SortOrder))
                .ToList());

    private sealed record MemberDraft(Guid SheetId, int Quantity);
}
