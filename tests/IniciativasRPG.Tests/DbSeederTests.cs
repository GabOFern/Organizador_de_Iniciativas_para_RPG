using FluentAssertions;
using IniciativasRPG.Api.Configuration;
using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace IniciativasRPG.Tests;

public class DbSeederTests : IAsyncDisposable
{
    private readonly SqliteConnection _connection;
    private readonly ServiceProvider _services;

    public DbSeederTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options.UseSqlite(_connection));
        services.AddLogging();
        services.Configure<AdminOptions>(_ => { });
        services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();
        _services = services.BuildServiceProvider();
    }

    public async ValueTask DisposeAsync()
    {
        await _services.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task Seed_EmptyDatabase_DoesNotCreateCampaign()
    {
        await DbSeeder.SeedAsync(_services);

        await using var scope = _services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.Campaigns.CountAsync()).Should().Be(0);
        (await db.Sheets.CountAsync()).Should().Be(0);
    }
}
