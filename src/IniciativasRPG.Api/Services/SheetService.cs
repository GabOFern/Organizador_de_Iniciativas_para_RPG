using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Services;

public interface ISheetService
{
    Task<IReadOnlyList<SheetDto>> ListAsync(CancellationToken ct = default);
    Task<SheetDto> CreateAsync(CreateSheetRequest request, CancellationToken ct = default);
    Task<SheetDto> UpdateAsync(Guid id, UpdateSheetRequest request, CancellationToken ct = default);
}

public class SheetService : ISheetService
{
    private readonly AppDbContext _db;

    public SheetService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<SheetDto>> ListAsync(CancellationToken ct = default)
    {
        var sheets = await _db.Sheets
            .OrderBy(s => s.Name)
            .ToListAsync(ct);

        return sheets.Select(Map).ToList();
    }

    public async Task<SheetDto> CreateAsync(CreateSheetRequest request, CancellationToken ct = default)
    {
        ValidateName(request.Name);

        var sheet = new Sheet
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            ImageUrl = NormalizeUrl(request.ImageUrl),
            Type = request.Type,
            MaxHp = request.MaxHp,
            CurrentHp = request.MaxHp,
            BaseAc = request.BaseAc,
            DexModifier = request.DexModifier
        };

        _db.Sheets.Add(sheet);
        await _db.SaveChangesAsync(ct);
        return Map(sheet);
    }

    public async Task<SheetDto> UpdateAsync(Guid id, UpdateSheetRequest request, CancellationToken ct = default)
    {
        ValidateName(request.Name);

        var sheet = await _db.Sheets.FirstOrDefaultAsync(s => s.Id == id, ct)
            ?? throw new DomainException(DomainMessages.SheetNotFound, StatusCodes.Status404NotFound);

        var inOpenBattle = await _db.Combatants
            .AnyAsync(c =>
                c.SheetId == id &&
                (c.Battle.Status == BattleStatus.Preparing || c.Battle.Status == BattleStatus.Active),
                ct);

        if (inOpenBattle)
        {
            throw new DomainException(DomainMessages.SheetInActiveBattle);
        }

        sheet.Name = request.Name.Trim();
        sheet.ImageUrl = NormalizeUrl(request.ImageUrl);
        sheet.Type = request.Type;
        sheet.MaxHp = request.MaxHp;
        sheet.CurrentHp = Math.Clamp(request.CurrentHp, BattleRules.MinHp, request.MaxHp);
        sheet.BaseAc = request.BaseAc;
        sheet.DexModifier = request.DexModifier;

        await _db.SaveChangesAsync(ct);
        return Map(sheet);
    }

    private static void ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException(DomainMessages.NameRequired);
        }
    }

    private static string? NormalizeUrl(string? url) =>
        string.IsNullOrWhiteSpace(url) ? null : url.Trim();

    private static SheetDto Map(Sheet sheet) => new(
        sheet.Id,
        sheet.Name,
        sheet.ImageUrl,
        sheet.Type.ToString(),
        sheet.MaxHp,
        sheet.CurrentHp,
        sheet.BaseAc,
        sheet.DexModifier);
}
