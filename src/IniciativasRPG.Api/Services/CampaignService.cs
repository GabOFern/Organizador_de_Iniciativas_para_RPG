using System.Security.Cryptography;
using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Services;

public interface ICampaignService
{
    Task<IReadOnlyList<CampaignSummaryDto>> ListAsync(CancellationToken ct = default);
    Task<CampaignSummaryDto> CreateAsync(CreateCampaignRequest request, CancellationToken ct = default);
    Task<CampaignMasterLoginResponse> MasterLoginAsync(Guid campaignId, CampaignMasterLoginRequest request, CancellationToken ct = default);
}

public class CampaignService : ICampaignService
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher<Campaign> _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;

    public CampaignService(
        AppDbContext db,
        IPasswordHasher<Campaign> passwordHasher,
        IJwtTokenService jwtTokenService)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<IReadOnlyList<CampaignSummaryDto>> ListAsync(CancellationToken ct = default)
    {
        return await _db.Campaigns
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAtUtc)
            .Select(c => new CampaignSummaryDto(
                c.Id,
                c.Name,
                c.ImageUrl,
                c.Description,
                c.PublicToken,
                c.CreatedAtUtc))
            .ToListAsync(ct);
    }

    public async Task<CampaignSummaryDto> CreateAsync(CreateCampaignRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new DomainException(DomainMessages.NameRequired);
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            throw new DomainException(DomainMessages.PasswordRequired);
        }

        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            PublicToken = GeneratePublicToken(),
            CreatedAtUtc = DateTime.UtcNow
        };
        campaign.PasswordHash = _passwordHasher.HashPassword(campaign, request.Password);

        _db.Campaigns.Add(campaign);
        await _db.SaveChangesAsync(ct);

        return new CampaignSummaryDto(
            campaign.Id,
            campaign.Name,
            campaign.ImageUrl,
            campaign.Description,
            campaign.PublicToken,
            campaign.CreatedAtUtc);
    }

    public async Task<CampaignMasterLoginResponse> MasterLoginAsync(
        Guid campaignId,
        CampaignMasterLoginRequest request,
        CancellationToken ct = default)
    {
        var campaign = await _db.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, ct)
            ?? throw new DomainException(DomainMessages.InvalidCredentials, StatusCodes.Status401Unauthorized);

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            throw new DomainException(DomainMessages.InvalidCredentials, StatusCodes.Status401Unauthorized);
        }

        var result = _passwordHasher.VerifyHashedPassword(campaign, campaign.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            throw new DomainException(DomainMessages.InvalidCredentials, StatusCodes.Status401Unauthorized);
        }

        var token = _jwtTokenService.CreateCampaignToken(campaign);
        return new CampaignMasterLoginResponse(token, campaign.Id, campaign.Name, campaign.PublicToken);
    }

    private static string GeneratePublicToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(BattleRules.PublicTokenLength);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
