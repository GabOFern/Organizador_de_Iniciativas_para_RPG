using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using IniciativasRPG.Api.Configuration;
using IniciativasRPG.Api.Domain;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace IniciativasRPG.Api.Services;

public interface IJwtTokenService
{
    string CreateToken(User user);
    string CreateCampaignToken(Campaign campaign);
}

public class JwtTokenService : IJwtTokenService
{
    private readonly JwtOptions _options;

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
        if (string.IsNullOrWhiteSpace(_options.Key) || _options.Key.Length < 32)
        {
            throw new InvalidOperationException(
                $"{DomainMessages.ConfigMissing} Configure Jwt:Key com ao menos 32 caracteres.");
        }
    }

    public string CreateToken(User user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim(ClaimTypes.Name, user.Username)
        };

        return WriteToken(claims);
    }

    public string CreateCampaignToken(Campaign campaign)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, campaign.Id.ToString()),
            new Claim(CampaignClaims.CampaignId, campaign.Id.ToString()),
            new Claim(CampaignClaims.CampaignName, campaign.Name),
            new Claim(ClaimTypes.Name, campaign.Name)
        };

        return WriteToken(claims);
    }

    private string WriteToken(IEnumerable<Claim> claims)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(_options.ExpirationMinutes);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
