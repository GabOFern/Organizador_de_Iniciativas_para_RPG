using FluentAssertions;
using IniciativasRPG.Api.Domain;
using IniciativasRPG.Api.Services;
using IniciativasRPG.Tests.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Tests;

public class SceneServiceTests : IAsyncDisposable
{
    private readonly TestDb _testDb = TestDb.Create();
    private readonly FakeBattleNotifier _notifier = new();
    private readonly SceneService _sut;
    private readonly Guid _campaignId;
    private readonly string _publicToken = "scene-token-12345678";

    public SceneServiceTests()
    {
        _campaignId = _testDb.SeedCampaign(publicToken: _publicToken);
        _sut = new SceneService(_testDb.Context, _notifier);
    }

    public ValueTask DisposeAsync() => _testDb.DisposeAsync();

    private static IFormFile PngFile(string name = "scene.png")
    {
        byte[] png =
        [
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        ];
        var stream = new MemoryStream(png);
        return new FormFile(stream, 0, png.Length, "file", name)
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/png",
        };
    }

    private Task<IReadOnlyList<IniciativasRPG.Api.Contracts.CampaignSceneDto>> CreateItem(
        string title = "Sala") =>
        _sut.CreateAsync(_campaignId, title, nameof(SceneKind.Item), null, PngFile());

    [Fact]
    public async Task Create_ValidFile_IsHiddenFromPlayersByDefault()
    {
        var list = await CreateItem();

        list.Should().HaveCount(1);
        list[0].Title.Should().Be("Sala");
        list[0].Kind.Should().Be(SceneKind.Item);
        list[0].IsVisibleToPlayers.Should().Be(SceneRules.VisibleToPlayersDefault);
        list[0].IsVisibleToPlayers.Should().BeFalse();
        _notifier.ScenesNotifyCount.Should().Be(1);
    }

    [Fact]
    public async Task Create_WithoutKind_Throws()
    {
        var act = () => _sut.CreateAsync(_campaignId, "Sala", null, null, PngFile());

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.SceneKindRequired);
    }

    [Fact]
    public async Task Create_UncategorizedKind_Throws()
    {
        var act = () => _sut.CreateAsync(
            _campaignId, "Sala", nameof(SceneKind.Uncategorized), null, PngFile());

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.SceneKindInvalid);
    }

    [Fact]
    public async Task ListByCampaign_IncludesHiddenAndVisible()
    {
        await CreateItem("Oculta");
        var afterSecond = await CreateItem("Visivel");
        var shownId = afterSecond.Single(s => s.Title == "Visivel").Id;
        await _sut.SetVisibilityAsync(_campaignId, shownId, true);

        var master = await _sut.ListByCampaignAsync(_campaignId);

        master.Should().HaveCount(2);
        master.Should().Contain(s => s.Title == "Oculta" && !s.IsVisibleToPlayers);
        master.Should().Contain(s => s.Title == "Visivel" && s.IsVisibleToPlayers);
    }

    [Fact]
    public async Task ListByPublicToken_ReturnsOnlyVisible()
    {
        await CreateItem("Oculta");
        var afterSecond = await CreateItem("Visivel");
        var shownId = afterSecond.Single(s => s.Title == "Visivel").Id;
        await _sut.SetVisibilityAsync(_campaignId, shownId, true);

        var pub = await _sut.ListByPublicTokenAsync(_publicToken);

        pub.Should().HaveCount(1);
        pub[0].Title.Should().Be("Visivel");
        pub[0].Id.Should().Be(shownId);
    }

    [Fact]
    public async Task ListByPublicToken_NewestVisibleFirst_MasterKeepsOldestFirst()
    {
        var first = await CreateItem("Antiga");
        var second = await CreateItem("Nova");
        var firstId = first.Single(s => s.Title == "Antiga").Id;
        var secondId = second.Single(s => s.Title == "Nova").Id;
        await _sut.SetVisibilityAsync(_campaignId, firstId, true);
        await _sut.SetVisibilityAsync(_campaignId, secondId, true);

        var pub = await _sut.ListByPublicTokenAsync(_publicToken);
        pub.Should().HaveCount(2);
        pub[0].Title.Should().Be("Nova");
        pub[1].Title.Should().Be("Antiga");

        var master = await _sut.ListByCampaignAsync(_campaignId);
        master.Should().HaveCount(2);
        master[0].Title.Should().Be("Antiga");
        master[1].Title.Should().Be("Nova");
    }

    [Fact]
    public async Task SetVisibility_True_AppearsInPublicList()
    {
        var created = await CreateItem("Cena");
        (await _sut.ListByPublicTokenAsync(_publicToken)).Should().BeEmpty();

        await _sut.SetVisibilityAsync(_campaignId, created[0].Id, true);

        var pub = await _sut.ListByPublicTokenAsync(_publicToken);
        pub.Should().ContainSingle(s => s.Id == created[0].Id && s.IsVisibleToPlayers);
    }

    [Fact]
    public async Task SetVisibility_False_RemovesFromPublicList()
    {
        var created = await CreateItem("Cena");
        await _sut.SetVisibilityAsync(_campaignId, created[0].Id, true);
        await _sut.SetVisibilityAsync(_campaignId, created[0].Id, false);

        (await _sut.ListByPublicTokenAsync(_publicToken)).Should().BeEmpty();
        (await _sut.ListByCampaignAsync(_campaignId)).Should().ContainSingle(s => !s.IsVisibleToPlayers);
    }

    [Fact]
    public async Task GetPublicImage_Hidden_ThrowsNotFound()
    {
        var created = await CreateItem("Cena");

        var act = () => _sut.GetPublicImageAsync(_publicToken, created[0].Id);

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.SceneNotFound);
    }

    [Fact]
    public async Task GetPublicImage_Visible_ReturnsContent()
    {
        var created = await CreateItem("Cena");
        await _sut.SetVisibilityAsync(_campaignId, created[0].Id, true);

        var image = await _sut.GetPublicImageAsync(_publicToken, created[0].Id);

        image.Content.Should().NotBeEmpty();
        image.ContentType.Should().Be(SheetRules.PngContentType);
    }

    [Fact]
    public async Task SetVisibility_UnknownScene_ThrowsNotFound()
    {
        var act = () => _sut.SetVisibilityAsync(_campaignId, Guid.NewGuid(), true);

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.SceneNotFound);
    }

    [Fact]
    public async Task Update_LegacyUncategorized_SetsKindAndTitle()
    {
        var created = await CreateItem("Velha");
        var scene = await _testDb.Context.CampaignScenes.SingleAsync(s => s.Id == created[0].Id);
        scene.Kind = SceneKind.Uncategorized;
        await _testDb.Context.SaveChangesAsync();

        var list = await _sut.UpdateAsync(
            _campaignId, created[0].Id, "Nova", nameof(SceneKind.Map), null, null);

        list.Should().ContainSingle(s => s.Id == created[0].Id && s.Title == "Nova" && s.Kind == SceneKind.Map);
    }

    [Fact]
    public async Task Update_MetadataOnly_PreservesImageBytes()
    {
        var created = await CreateItem("Cena");
        var before = await _testDb.Context.CampaignScenes.AsNoTracking()
            .SingleAsync(s => s.Id == created[0].Id);
        before.ImageContent.Should().NotBeNull();

        await _sut.UpdateAsync(
            _campaignId, created[0].Id, "Cena2", nameof(SceneKind.Npc), null, null);

        var after = await _testDb.Context.CampaignScenes.AsNoTracking()
            .SingleAsync(s => s.Id == created[0].Id);
        after.Title.Should().Be("Cena2");
        after.Kind.Should().Be(SceneKind.Npc);
        after.ImageContent.Should().BeEquivalentTo(before.ImageContent);
        after.ImageContentType.Should().Be(before.ImageContentType);
        after.IsVisibleToPlayers.Should().Be(before.IsVisibleToPlayers);
    }

    [Fact]
    public async Task Update_UnknownScene_ThrowsNotFound()
    {
        var act = () => _sut.UpdateAsync(
            _campaignId, Guid.NewGuid(), "X", nameof(SceneKind.Item), null, null);

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.SceneNotFound);
    }
}
