using IniciativasRPG.Api.Data;
using IniciativasRPG.Api.Domain;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Tests.Helpers;

/// <summary>
/// Cria um AppDbContext com SQLite in-memory para testes.
/// Cada instância tem um banco isolado que é descartado ao final.
/// </summary>
public sealed class TestDb : IDisposable, IAsyncDisposable
{
    private readonly SqliteConnection _connection;
    public AppDbContext Context { get; }

    private TestDb(SqliteConnection connection, AppDbContext context)
    {
        _connection = connection;
        Context = context;
    }

    /// <summary>Cria o banco, aplica o schema e insere uma campanha padrão.</summary>
    public static TestDb Create()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        return new TestDb(connection, context);
    }

    /// <summary>Insere uma campanha com token público e retorna o Id.</summary>
    public Guid SeedCampaign(string name = "Campanha Teste", string publicToken = "test-token-12345678")
    {
        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            Name = name,
            PasswordHash = "hash-placeholder",
            PublicToken = publicToken,
            CreatedAtUtc = DateTime.UtcNow,
        };
        Context.Campaigns.Add(campaign);
        Context.SaveChanges();
        return campaign.Id;
    }

    public void Dispose()
    {
        Context.Dispose();
        _connection.Dispose();
    }

    public async ValueTask DisposeAsync()
    {
        await Context.DisposeAsync();
        await _connection.DisposeAsync();
    }
}
