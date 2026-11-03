using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using FluentAssertions;
using IniciativasRPG.Api.Configuration;
using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Domain;
using IniciativasRPG.Api.Services;
using IniciativasRPG.Tests.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace IniciativasRPG.Tests;

public class CampaignServiceTests : IAsyncDisposable
{
    private const string TestJwtKey = "campaign-master-test-key-32b-min!!";

    private readonly TestDb _testDb = TestDb.Create();
    private readonly PasswordHasher<Campaign> _passwordHasher = new();
    private readonly CampaignService _sut;

    public CampaignServiceTests()
    {
        _sut = new CampaignService(
            _testDb.Context,
            _passwordHasher,
            new JwtTokenService(Options.Create(new JwtOptions
            {
                Key = TestJwtKey,
                Issuer = "iniciativas-rpg-tests",
                Audience = "iniciativas-rpg-tests",
                ExpirationMinutes = 60
            })));
    }

    public ValueTask DisposeAsync() => _testDb.DisposeAsync();

    [Fact]
    public async Task CreateCampaign_AddsSampleNpcSheets()
    {
        var created = await _sut.CreateAsync(new CreateCampaignRequest(
            Name: "Mesa nova",
            ImageUrl: null,
            Description: null,
            Password: "senha-do-mestre"));

        var names = await _testDb.Context.Sheets
            .Where(s => s.CampaignId == created.Id)
            .Select(s => s.Name)
            .ToListAsync();

        names.Should().BeEquivalentTo(SampleNpcSheetContent.Names);
        (await _testDb.Context.Campaigns.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Create_ValidPassword_StoresHashNotPlaintext()
    {
        const string password = "senha-do-mestre";

        var created = await _sut.CreateAsync(new CreateCampaignRequest(
            Name: "Mesa nova",
            ImageUrl: null,
            Description: null,
            Password: password));

        var stored = await _testDb.Context.Campaigns.SingleAsync(c => c.Id == created.Id);
        stored.PasswordHash.Should().NotBeNullOrWhiteSpace();
        stored.PasswordHash.Should().NotBe(password);
        _passwordHasher.VerifyHashedPassword(stored, stored.PasswordHash, password)
            .Should().Be(PasswordVerificationResult.Success);
    }

    [Fact]
    public async Task Create_EmptyPassword_Throws()
    {
        foreach (var password in new[] { "", "   " })
        {
            var act = () => _sut.CreateAsync(new CreateCampaignRequest(
                Name: "Mesa nova",
                ImageUrl: null,
                Description: null,
                Password: password));

            (await act.Should().ThrowAsync<DomainException>())
                .WithMessage(DomainMessages.PasswordRequired);
        }

        (await _testDb.Context.Campaigns.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task MasterLogin_CorrectPassword_ReturnsTokenWithMasterRole()
    {
        const string password = "senha-do-mestre";
        var created = await _sut.CreateAsync(new CreateCampaignRequest(
            Name: "Mesa nova",
            ImageUrl: null,
            Description: null,
            Password: password));

        var response = await _sut.MasterLoginAsync(
            created.Id,
            new CampaignMasterLoginRequest(password));

        response.CampaignId.Should().Be(created.Id);
        response.CampaignName.Should().Be("Mesa nova");
        response.Token.Should().NotBeNullOrWhiteSpace();

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(response.Token);
        jwt.Claims.Should().Contain(c =>
            c.Type == CampaignClaims.Role && c.Value == CampaignRoles.Master);
        jwt.Claims.Should().Contain(c =>
            c.Type == CampaignClaims.CampaignId && c.Value == created.Id.ToString());
    }

    [Fact]
    public async Task MasterLogin_WrongPassword_ThrowsUnauthorized()
    {
        var created = await _sut.CreateAsync(new CreateCampaignRequest(
            Name: "Mesa nova",
            ImageUrl: null,
            Description: null,
            Password: "senha-certa"));

        var act = () => _sut.MasterLoginAsync(
            created.Id,
            new CampaignMasterLoginRequest("senha-errada"));

        var exception = (await act.Should().ThrowAsync<DomainException>()).Which;
        exception.Message.Should().Be(DomainMessages.InvalidCredentials);
        exception.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
    }

    [Fact]
    public async Task List_DoesNotExposePasswordHash()
    {
        const string password = "senha-do-mestre";
        await _sut.CreateAsync(new CreateCampaignRequest(
            Name: "Mesa nova",
            ImageUrl: null,
            Description: null,
            Password: password));

        typeof(CampaignSummaryDto)
            .GetProperties()
            .Select(p => p.Name)
            .Should().NotContain(nameof(Campaign.PasswordHash))
            .And.NotContain("Password");

        var listed = await _sut.ListAsync();
        var storedHash = await _testDb.Context.Campaigns.Select(c => c.PasswordHash).SingleAsync();
        var json = JsonSerializer.Serialize(listed);

        listed.Should().ContainSingle();
        json.Should().NotContain(storedHash);
        json.Should().NotContain(password);
        json.Should().NotContain("PasswordHash");
        json.Should().NotContain("passwordHash");
    }
}
