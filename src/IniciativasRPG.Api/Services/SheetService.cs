using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Services;

public interface ISheetService
{
    Task<IReadOnlyList<SheetDto>> ListAsync(Guid campaignId, CancellationToken ct = default);
    Task<SheetDto> CreateAsync(Guid campaignId, CreateSheetRequest request, CancellationToken ct = default);
    Task<SheetDto> UpdateAsync(Guid campaignId, Guid id, UpdateSheetRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid campaignId, Guid id, CancellationToken ct = default);
    Task<SheetDto> SetImageAsync(Guid campaignId, Guid id, IFormFile file, CancellationToken ct = default);
    Task<SheetDto> ClearImageAsync(Guid campaignId, Guid id, CancellationToken ct = default);
    Task<SheetImageFile> GetPublicImageAsync(string publicToken, Guid sheetId, CancellationToken ct = default);
}

public class SheetService : ISheetService
{
    private readonly AppDbContext _db;
    private readonly IDiceService _diceService;
    private readonly IImageStoreOptimizer _images;

    public SheetService(AppDbContext db, IDiceService diceService, IImageStoreOptimizer images)
    {
        _db = db;
        _diceService = diceService;
        _images = images;
    }

    public async Task<IReadOnlyList<SheetDto>> ListAsync(Guid campaignId, CancellationToken ct = default)
    {
        var sheets = await _db.Sheets
            .AsNoTracking()
            .Include(s => s.Features)
            .Include(s => s.Attacks)
            .Include(s => s.Spells)
            .Include(s => s.Weapons)
            .Where(s => s.CampaignId == campaignId)
            .OrderBy(s => s.Name)
            .ToListAsync(ct);

        var publicToken = await PublicTokenAsync(campaignId, ct);
        var storedIds = await _db.SheetImages
            .Where(i => i.Sheet.CampaignId == campaignId)
            .Select(i => i.SheetId)
            .ToListAsync(ct);
        var stored = storedIds.ToHashSet();
        return sheets.Select(sheet => Map(sheet, publicToken, stored.Contains(sheet.Id))).ToList();
    }

    public async Task<SheetDto> CreateAsync(Guid campaignId, CreateSheetRequest request, CancellationToken ct = default)
    {
        ValidateName(request.Name);
        var features = ValidateFeatures(request.Features);
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
            PlayerName = NormalizePlayerName(request.Type, request.PlayerName),
            ImageUrl = NormalizeImageUrl(request.ImageUrl),
            ImageFocusX = ClampFocus(request.ImageFocusX),
            ImageFocusY = ClampFocus(request.ImageFocusY),
            ImageScale = ClampScale(request.ImageScale),
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
            InitiativeBonus = request.InitiativeBonus,
            ProficiencyBonus = request.ProficiencyBonus
        };

        ApplyCollections(sheet, features, attacks, spells, weapons);
        _db.Sheets.Add(sheet);
        await _db.SaveChangesAsync(ct);
        return await MapAsync(sheet, ct);
    }

    public async Task<SheetDto> UpdateAsync(Guid campaignId, Guid id, UpdateSheetRequest request, CancellationToken ct = default)
    {
        ValidateName(request.Name);
        var features = ValidateFeatures(request.Features);
        var attacks = ValidateAttacks(request.Attacks);
        var spells = ValidateSpells(request.Spells);
        var weapons = ValidateWeapons(request.Weapons);

        var sheet = await _db.Sheets
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
        sheet.PlayerName = NormalizePlayerName(request.Type, request.PlayerName);
        sheet.ImageUrl = NormalizeImageUrl(request.ImageUrl);
        if (sheet.ImageUrl is not null)
        {
            var storedImage = await _db.SheetImages.FirstOrDefaultAsync(i => i.SheetId == sheet.Id, ct);
            if (storedImage is not null)
            {
                _db.SheetImages.Remove(storedImage);
            }
        }
        sheet.ImageFocusX = ClampFocus(request.ImageFocusX);
        sheet.ImageFocusY = ClampFocus(request.ImageFocusY);
        sheet.ImageScale = ClampScale(request.ImageScale);
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
        sheet.InitiativeBonus = request.InitiativeBonus;
        sheet.ProficiencyBonus = request.ProficiencyBonus;

        await using var transaction = await _db.Database.BeginTransactionAsync(ct);
        await _db.SheetFeatures.Where(f => f.SheetId == sheet.Id).ExecuteDeleteAsync(ct);
        await _db.SheetAttacks.Where(a => a.SheetId == sheet.Id).ExecuteDeleteAsync(ct);
        await _db.SheetSpells.Where(s => s.SheetId == sheet.Id).ExecuteDeleteAsync(ct);
        await _db.SheetWeapons.Where(w => w.SheetId == sheet.Id).ExecuteDeleteAsync(ct);
        ApplyCollections(sheet, features, attacks, spells, weapons);
        await _db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return await MapAsync(sheet, ct);
    }

    public async Task DeleteAsync(Guid campaignId, Guid id, CancellationToken ct = default)
    {
        var sheet = await FindSheetAsync(campaignId, id, ct);
        await EnsureNotInOpenBattleAsync(campaignId, id, ct);

        await using var transaction = await _db.Database.BeginTransactionAsync(ct);
        // Combatant → Sheet é Restrict; remove histórico de batalhas finalizadas.
        await _db.ActiveModifiers
            .Where(m => m.Combatant.SheetId == id)
            .ExecuteDeleteAsync(ct);
        await _db.Combatants
            .Where(c => c.SheetId == id)
            .ExecuteDeleteAsync(ct);
        _db.Sheets.Remove(sheet);
        await _db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }

    public async Task<SheetDto> SetImageAsync(Guid campaignId, Guid id, IFormFile file, CancellationToken ct = default)
    {
        var sheet = await FindSheetAsync(campaignId, id, ct);
        await EnsureNotInOpenBattleAsync(campaignId, id, ct);
        var image = await ReadImageAsync(file, ct);

        sheet.ImageUrl = null;
        var stored = await _db.SheetImages.FirstOrDefaultAsync(i => i.SheetId == sheet.Id, ct);
        if (stored is null)
        {
            stored = new SheetImage { SheetId = sheet.Id };
            _db.SheetImages.Add(stored);
        }

        stored.Content = image.Content;
        stored.ContentType = image.ContentType;
        await _db.SaveChangesAsync(ct);
        return await MapAsync(sheet, ct);
    }

    public async Task<SheetDto> ClearImageAsync(Guid campaignId, Guid id, CancellationToken ct = default)
    {
        var sheet = await FindSheetAsync(campaignId, id, ct);
        await EnsureNotInOpenBattleAsync(campaignId, id, ct);
        var stored = await _db.SheetImages.FirstOrDefaultAsync(i => i.SheetId == sheet.Id, ct);
        if (stored is not null)
        {
            _db.SheetImages.Remove(stored);
            await _db.SaveChangesAsync(ct);
        }

        return await MapAsync(sheet, ct);
    }

    public async Task<SheetImageFile> GetPublicImageAsync(string publicToken, Guid sheetId, CancellationToken ct = default)
    {
        var image = await _db.SheetImages
            .AsNoTracking()
            .Where(i => i.SheetId == sheetId && i.Sheet.Campaign.PublicToken == publicToken)
            .Select(i => new SheetImageFile(i.Content, i.ContentType))
            .FirstOrDefaultAsync(ct)
            ?? throw new DomainException(DomainMessages.SheetNotFound, StatusCodes.Status404NotFound);

        return image;
    }

    private List<SheetFeatureInput> ValidateFeatures(IReadOnlyList<SheetFeatureInput>? items)
    {
        var list = items?.ToList() ?? [];
        foreach (var item in list)
        {
            if (string.IsNullOrWhiteSpace(item.Title))
            {
                throw new DomainException(DomainMessages.FeatureTitleRequired);
            }

            if (item.Title.Trim().Length > SheetFeatureRules.MaxTitleLength)
            {
                throw new DomainException(DomainMessages.FeatureTitleTooLong);
            }

            if (string.IsNullOrWhiteSpace(item.Text))
            {
                throw new DomainException(DomainMessages.FeatureTextRequired);
            }

            if (item.Text.Trim().Length > SheetFeatureRules.TextLimit(item.Kind))
            {
                throw new DomainException(DomainMessages.FeatureTextTooLong);
            }
        }

        return list;
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
        IReadOnlyList<SheetFeatureInput> features,
        IReadOnlyList<SheetAttackInput> attacks,
        IReadOnlyList<SheetSpellInput> spells,
        IReadOnlyList<SheetWeaponInput> weapons)
    {
        for (var i = 0; i < features.Count; i++)
        {
            var feature = features[i];
            sheet.Features.Add(new SheetFeature
            {
                SheetId = sheet.Id,
                Kind = feature.Kind,
                Title = feature.Title.Trim(),
                Text = feature.Text.Trim(),
                SortOrder = i
            });
        }

        for (var i = 0; i < attacks.Count; i++)
        {
            var a = attacks[i];
            sheet.Attacks.Add(new SheetAttack
            {
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

    private async Task<Sheet> FindSheetAsync(Guid campaignId, Guid id, CancellationToken ct)
    {
        return await _db.Sheets
                .Include(s => s.Features)
                .Include(s => s.Attacks)
                .Include(s => s.Spells)
                .Include(s => s.Weapons)
                .FirstOrDefaultAsync(s => s.Id == id && s.CampaignId == campaignId, ct)
            ?? throw new DomainException(DomainMessages.SheetNotFound, StatusCodes.Status404NotFound);
    }

    private async Task EnsureNotInOpenBattleAsync(Guid campaignId, Guid id, CancellationToken ct)
    {
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
    }

    private async Task<ImageStoreResult> ReadImageAsync(IFormFile file, CancellationToken ct)
    {
        if (file.Length == 0)
        {
            throw new DomainException(DomainMessages.SheetImageRequired);
        }

        if (file.Length > SheetRules.MaxImageUploadBytes)
        {
            throw new DomainException(DomainMessages.SheetImageUploadTooLarge);
        }

        await using var stream = file.OpenReadStream();
        using var buffer = new MemoryStream();
        await stream.CopyToAsync(buffer, ct);
        if (buffer.Length > SheetRules.MaxImageUploadBytes)
        {
            throw new DomainException(DomainMessages.SheetImageUploadTooLarge);
        }

        return _images.Prepare(buffer.GetBuffer().AsSpan(0, (int)buffer.Length));
    }

    private async Task<string> PublicTokenAsync(Guid campaignId, CancellationToken ct) =>
        await _db.Campaigns
            .Where(c => c.Id == campaignId)
            .Select(c => c.PublicToken)
            .FirstAsync(ct);

    private async Task<SheetDto> MapAsync(Sheet sheet, CancellationToken ct)
    {
        var publicToken = await PublicTokenAsync(sheet.CampaignId, ct);
        var hasStoredImage = await _db.SheetImages.AnyAsync(i => i.SheetId == sheet.Id, ct);
        return Map(sheet, publicToken, hasStoredImage);
    }

    private static string? NormalizeImageUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return null;
        }

        var trimmed = url.Trim();
        if (trimmed.Length > SheetRules.MaxImageUrlLength)
        {
            throw new DomainException(DomainMessages.SheetImageUrlTooLong);
        }

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new DomainException(DomainMessages.SheetImageUrlInvalid);
        }

        return trimmed;
    }

    private static double ClampFocus(double value) => Math.Clamp(value, 0, 100);

    private static double ClampScale(double value) =>
        Math.Clamp(value, SheetRules.ImageScaleMin, SheetRules.ImageScaleMax);

    private static SheetDto Map(Sheet sheet, string publicToken, bool hasStoredImage) => new(
        sheet.Id,
        sheet.Name,
        hasStoredImage ? SheetImagePaths.Public(publicToken, sheet.Id) : sheet.ImageUrl,
        sheet.ImageFocusX,
        sheet.ImageFocusY,
        sheet.ImageScale,
        sheet.Type.ToString(),
        sheet.Class.ToString(),
        sheet.MaxHp,
        sheet.CurrentHp,
        sheet.BaseAc,
        sheet.DexModifier,
        sheet.InitiativeBonus,
        sheet.ProficiencyBonus,
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
        sheet.Features.OrderBy(f => f.SortOrder).Select(MapFeature).ToList(),
        sheet.Attacks.OrderBy(a => a.SortOrder).Select(MapAttack).ToList(),
        sheet.Spells.OrderBy(s => s.SortOrder).Select(MapSpell).ToList(),
        sheet.Weapons.OrderBy(w => w.SortOrder).Select(MapWeapon).ToList(),
        hasStoredImage,
        sheet.PlayerName);

    private static string? NormalizePlayerName(SheetType type, string? playerName)
    {
        if (type != SheetType.Player)
        {
            return null;
        }

        var trimmed = playerName?.Trim() ?? string.Empty;
        if (trimmed.Length == 0)
        {
            return null;
        }

        if (trimmed.Length > SheetRules.MaxPlayerNameLength)
        {
            throw new DomainException(DomainMessages.SheetPlayerNameTooLong);
        }

        return trimmed;
    }

    internal static SheetFeatureDto MapFeature(SheetFeature feature) =>
        new(feature.Id, feature.Kind.ToString(), feature.Title, feature.Text, feature.SortOrder);

    internal static SheetAttackDto MapAttack(SheetAttack a) =>
        new(a.Id, a.Description, a.DamageDice, a.AbilityBase.ToString(), a.StrikeType.ToString(), a.SortOrder);

    internal static SheetSpellDto MapSpell(SheetSpell s) =>
        new(s.Id, s.Description, s.DamageDice, s.SlotLevel, s.RequiresMaterial, s.AbilityBase.ToString(), s.SortOrder);

    internal static SheetWeaponDto MapWeapon(SheetWeapon w) =>
        new(w.Id, w.Description, w.DamageDice, w.Range, w.StrikeType.ToString(), w.SortOrder);
}
