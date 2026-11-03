using FluentAssertions;
using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using IniciativasRPG.Api.Services;
using IniciativasRPG.Tests.Helpers;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Tests;

public class CampaignServiceTests : IAsyncDisposable
{
    private readonly TestDb _testDb = TestDb.Create();
    private readonly CampaignService _sut;

    public CampaignServiceTests()
    {
        _sut = new CampaignService(
            _testDb.Context,
            new PasswordHasher<Campaign>(),
            new UnusedJwtTokenService());
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

    private sealed class UnusedJwtTokenService : IJwtTokenService
    {
        public string CreateToken(User user) => "unused";

        public string CreateCampaignToken(Campaign campaign) => "unused";
    }
}
