using System.Security.Claims;
using IniciativasRPG.Api.Domain;

namespace IniciativasRPG.Api.Services;

public static class CampaignPrincipalExtensions
{
    public static Guid GetRequiredCampaignId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(CampaignClaims.CampaignId);
        if (value is null || !Guid.TryParse(value, out var id))
        {
            throw new DomainException(DomainMessages.InvalidCredentials, StatusCodes.Status401Unauthorized);
        }

        return id;
    }
}
