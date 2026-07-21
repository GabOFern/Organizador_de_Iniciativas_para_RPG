using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Services;

public interface IModifierTypeService
{
    Task<IReadOnlyList<ModifierTypeDto>> ListAsync(CancellationToken ct = default);
    Task<ModifierTypeDto> CreateAsync(CreateModifierTypeRequest request, CancellationToken ct = default);
    Task<ModifierTypeDto> UpdateAsync(Guid id, UpdateModifierTypeRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public class ModifierTypeService : IModifierTypeService
{
    private readonly AppDbContext _db;

    public ModifierTypeService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ModifierTypeDto>> ListAsync(CancellationToken ct = default)
    {
        var items = await _db.ModifierTypes
            .OrderBy(t => t.Name)
            .ToListAsync(ct);
        return items.Select(Map).ToList();
    }

    public async Task<ModifierTypeDto> CreateAsync(CreateModifierTypeRequest request, CancellationToken ct = default)
    {
        Validate(request.Name, request.DefaultDuration);

        var entity = new ModifierType
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            DefaultDuration = request.DefaultDuration,
            SkipsTurn = request.SkipsTurn
        };
        _db.ModifierTypes.Add(entity);
        await _db.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task<ModifierTypeDto> UpdateAsync(Guid id, UpdateModifierTypeRequest request, CancellationToken ct = default)
    {
        Validate(request.Name, request.DefaultDuration);

        var entity = await _db.ModifierTypes.FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new DomainException(DomainMessages.ModifierTypeNotFound, StatusCodes.Status404NotFound);

        entity.Name = request.Name.Trim();
        entity.DefaultDuration = request.DefaultDuration;
        entity.SkipsTurn = request.SkipsTurn;
        await _db.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.ModifierTypes.FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new DomainException(DomainMessages.ModifierTypeNotFound, StatusCodes.Status404NotFound);

        _db.ModifierTypes.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }

    private static void Validate(string name, int defaultDuration)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException(DomainMessages.NameRequired);
        }

        if (defaultDuration < 1)
        {
            throw new DomainException(DomainMessages.DurationMustBePositive);
        }
    }

    private static ModifierTypeDto Map(ModifierType t) =>
        new(t.Id, t.Name, t.DefaultDuration, t.SkipsTurn);
}
