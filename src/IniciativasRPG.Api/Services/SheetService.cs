using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Services;

public interface ISheetService
{
    Task<IReadOnlyList<SheetDto>> ListAsync(Guid campaignId, CancellationToken ct = default);
    Task<SheetDto> CreateAsync(Guid campaignId, CreateSheetRequest request, CancellationToken ct = default);
    Task<SheetDto> UpdateAsync(Guid campaignId, Guid id, UpdateSheetRequest request, CancellationToken ct = default);
}

public class SheetService : ISheetService
{
    private readonly AppDbContext _db;
    private readonly IDiceService _diceService;

    public SheetService(AppDbContext db, IDiceService diceService)
    {
        _db = db;
        _diceService = diceService;
    }

    public async Task<IReadOnlyList<SheetDto>> ListAsync(Guid campaignId, CancellationToken ct = default)
    {
        var sheets = await _db.Sheets
            .AsNoTracking()
            .Include(s => s.Attacks)
            .Include(s => s.Spells)
            .Include(s => s.Weapons)
            .Where(s => s.CampaignId == campaignId)
            .OrderBy(s => s.Name)
            .ToListAsync(ct);

        return sheets.Select(Map).ToList();
    }

    public async Task<SheetDto> CreateAsync(Guid campaignId, CreateSheetRequest request, CancellationToken ct = default)
    {
        ValidateName(request.Name);
        var attacks = ValidateAttacks(request.Attacks);
        var spells = ValidateSpells(request.Spells);
        var weapons = ValidateWeapons(request.Weapons);

        var strength = AbilityScores.Clamp(request.Strength);
        var dexterity = AbilityScores.Clamp(request.Dexterity);
        var constitution = AbilityScores.Clamp(request.Constitution);
        var intelligence = AbilityScores.Clamp(request.Intelligence);
        var wisdom = AbilityScores.Clamp(request.Wisdom);
        var charisma = AbilityScores.Clamp(request.Charisma);

        var sheet = new Sheet
        {
            Id = Guid.NewGuid(),
            CampaignId = campaignId,
            Name = request.Name.Trim(),
            ImageUrl = NormalizeUrl(request.ImageUrl),
            ImageFocusX = ClampFocus(request.ImageFocusX),
            ImageFocusY = ClampFocus(request.ImageFocusY),
            Type = request.Type,
            Class = request.Class,
            MaxHp = request.MaxHp,
            CurrentHp = request.MaxHp,
            BaseAc = request.BaseAc,
            Strength = strength,
            Dexterity = dexterity,
            Constitution = constitution,
            Intelligence = intelligence,
            Wisdom = wisdom,
            Charisma = charisma,
            DexModifier = AbilityScores.Modifier(dexterity),
            Resistances = NormalizeText(request.Resistances)
        };

        ApplyCollections(sheet, attacks, spells, weapons);
        _db.Sheets.Add(sheet);
        await _db.SaveChangesAsync(ct);
        return Map(sheet);
    }

    public async Task<SheetDto> UpdateAsync(Guid campaignId, Guid id, UpdateSheetRequest request, CancellationToken ct = default)
    {
        ValidateName(request.Name);
        var attacks = ValidateAttacks(request.Attacks);
        var spells = ValidateSpells(request.Spells);
        var weapons = ValidateWeapons(request.Weapons);

        var sheet = await _db.Sheets
                .Include(s => s.Attacks)
                .Include(s => s.Spells)
                .Include(s => s.Weapons)
                .FirstOrDefaultAsync(s => s.Id == id && s.CampaignId == campaignId, ct)
            ?? throw new DomainException(DomainMessages.SheetNotFound, StatusCodes.Status404NotFound);

        var inOpenBattle = await _db.Combatants
            .AnyAsync(c =>
                c.SheetId == id &&
                c.Battle.CampaignId == campaignId &&
                (c.Battle.Status == BattleStatus.Preparing || c.Battle.Status == BattleStatus.Active),
                ct);

        if (inOpenBattle)
        {
            throw new DomainException(DomainMessages.SheetInActiveBattle);
        }

        var strength = AbilityScores.Clamp(request.Strength);
        var dexterity = AbilityScores.Clamp(request.Dexterity);
        var constitution = AbilityScores.Clamp(request.Constitution);
        var intelligence = AbilityScores.Clamp(request.Intelligence);
        var wisdom = AbilityScores.Clamp(request.Wisdom);
        var charisma = AbilityScores.Clamp(request.Charisma);

        sheet.Name = request.Name.Trim();
        sheet.ImageUrl = NormalizeUrl(request.ImageUrl);
        sheet.ImageFocusX = ClampFocus(request.ImageFocusX);
        sheet.ImageFocusY = ClampFocus(request.ImageFocusY);
        sheet.Type = request.Type;
        sheet.Class = request.Class;
        sheet.MaxHp = request.MaxHp;
        sheet.CurrentHp = Math.Clamp(request.CurrentHp, BattleRules.MinHp, request.MaxHp);
        sheet.BaseAc = request.BaseAc;
        sheet.Strength = strength;
        sheet.Dexterity = dexterity;
        sheet.Constitution = constitution;
        sheet.Intelligence = intelligence;
        sheet.Wisdom = wisdom;
        sheet.Charisma = charisma;
        sheet.DexModifier = AbilityScores.Modifier(dexterity);
        sheet.Resistances = NormalizeText(request.Resistances);

        _db.SheetAttacks.RemoveRange(sheet.Attacks);
        _db.SheetSpells.RemoveRange(sheet.Spells);
        _db.SheetWeapons.RemoveRange(sheet.Weapons);
        sheet.Attacks.Clear();
        sheet.Spells.Clear();
        sheet.Weapons.Clear();
        ApplyCollections(sheet, attacks, spells, weapons);

        await _db.SaveChangesAsync(ct);
        return Map(sheet);
    }

    private List<SheetAttackInput> ValidateAttacks(IReadOnlyList<SheetAttackInput>? items)
    {
        var list = items?.ToList() ?? [];
        foreach (var item in list)
        {
            if (string.IsNullOrWhiteSpace(item.Description))
            {
                throw new DomainException(DomainMessages.DescriptionRequired);
            }

            if (string.IsNullOrWhiteSpace(item.DamageDice) || !_diceService.IsValidNotation(item.DamageDice))
            {
                throw new DomainException(DomainMessages.AttackDamageRequired);
            }
        }

        return list;
    }

    private List<SheetSpellInput> ValidateSpells(IReadOnlyList<SheetSpellInput>? items)
    {
        var list = items?.ToList() ?? [];
        foreach (var item in list)
        {
            if (string.IsNullOrWhiteSpace(item.Description))
            {
                throw new DomainException(DomainMessages.DescriptionRequired);
            }

            if (item.SlotLevel is < 0 or > 9)
            {
                throw new DomainException(DomainMessages.InvalidSpellSlot);
            }

            if (!string.IsNullOrWhiteSpace(item.DamageDice) && !_diceService.IsValidNotation(item.DamageDice))
            {
                throw new DomainException(DomainMessages.InvalidDiceNotation);
            }
        }

        return list;
    }

    private List<SheetWeaponInput> ValidateWeapons(IReadOnlyList<SheetWeaponInput>? items)
    {
        var list = items?.ToList() ?? [];
        foreach (var item in list)
        {
            if (string.IsNullOrWhiteSpace(item.Description))
            {
                throw new DomainException(DomainMessages.DescriptionRequired);
            }

            if (string.IsNullOrWhiteSpace(item.DamageDice) || !_diceService.IsValidNotation(item.DamageDice))
            {
                throw new DomainException(DomainMessages.WeaponDamageRequired);
            }

            if (string.IsNullOrWhiteSpace(item.Range))
            {
                throw new DomainException(DomainMessages.WeaponRangeRequired);
            }
        }

        return list;
    }

    private static void ApplyCollections(
        Sheet sheet,
        IReadOnlyList<SheetAttackInput> attacks,
        IReadOnlyList<SheetSpellInput> spells,
        IReadOnlyList<SheetWeaponInput> weapons)
    {
        for (var i = 0; i < attacks.Count; i++)
        {
            var a = attacks[i];
            sheet.Attacks.Add(new SheetAttack
            {
                Id = Guid.NewGuid(),
                SheetId = sheet.Id,
                Description = a.Description.Trim(),
                DamageDice = a.DamageDice.Trim(),
                AbilityBase = a.AbilityBase,
                StrikeType = a.StrikeType,
                SortOrder = i
            });
        }

        for (var i = 0; i < spells.Count; i++)
        {
            var s = spells[i];
            sheet.Spells.Add(new SheetSpell
            {
                Id = Guid.NewGuid(),
                SheetId = sheet.Id,
                Description = s.Description.Trim(),
                DamageDice = string.IsNullOrWhiteSpace(s.DamageDice) ? null : s.DamageDice.Trim(),
                SlotLevel = s.SlotLevel,
                RequiresMaterial = s.RequiresMaterial,
                AbilityBase = s.AbilityBase,
                SortOrder = i
            });
        }

        for (var i = 0; i < weapons.Count; i++)
        {
            var w = weapons[i];
            sheet.Weapons.Add(new SheetWeapon
            {
                Id = Guid.NewGuid(),
                SheetId = sheet.Id,
                Description = w.Description.Trim(),
                DamageDice = w.DamageDice.Trim(),
                Range = w.Range.Trim(),
                StrikeType = w.StrikeType,
                SortOrder = i
            });
        }
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

    private static string? NormalizeText(string? text) =>
        string.IsNullOrWhiteSpace(text) ? null : text.Trim();

    private static double ClampFocus(double value) => Math.Clamp(value, 0, 100);

    private static SheetDto Map(Sheet sheet) => new(
        sheet.Id,
        sheet.Name,
        sheet.ImageUrl,
        sheet.ImageFocusX,
        sheet.ImageFocusY,
        sheet.Type.ToString(),
        sheet.Class.ToString(),
        sheet.MaxHp,
        sheet.CurrentHp,
        sheet.BaseAc,
        sheet.DexModifier,
        sheet.Strength,
        AbilityScores.Modifier(sheet.Strength),
        sheet.Dexterity,
        AbilityScores.Modifier(sheet.Dexterity),
        sheet.Constitution,
        AbilityScores.Modifier(sheet.Constitution),
        sheet.Intelligence,
        AbilityScores.Modifier(sheet.Intelligence),
        sheet.Wisdom,
        AbilityScores.Modifier(sheet.Wisdom),
        sheet.Charisma,
        AbilityScores.Modifier(sheet.Charisma),
        sheet.Resistances,
        sheet.Attacks.OrderBy(a => a.SortOrder).Select(MapAttack).ToList(),
        sheet.Spells.OrderBy(s => s.SortOrder).Select(MapSpell).ToList(),
        sheet.Weapons.OrderBy(w => w.SortOrder).Select(MapWeapon).ToList());

    internal static SheetAttackDto MapAttack(SheetAttack a) =>
        new(a.Id, a.Description, a.DamageDice, a.AbilityBase.ToString(), a.StrikeType.ToString(), a.SortOrder);

    internal static SheetSpellDto MapSpell(SheetSpell s) =>
        new(s.Id, s.Description, s.DamageDice, s.SlotLevel, s.RequiresMaterial, s.AbilityBase.ToString(), s.SortOrder);

    internal static SheetWeaponDto MapWeapon(SheetWeapon w) =>
        new(w.Id, w.Description, w.DamageDice, w.Range, w.StrikeType.ToString(), w.SortOrder);
}
