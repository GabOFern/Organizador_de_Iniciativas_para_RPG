using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        await db.Database.MigrateAsync();

        await SampleNpcSheetSeeder.ApplyAsync(db);
        logger.LogInformation("Fichas NPC/criatura de exemplo aplicadas (idempotente).");
        await SampleSheetImageSeeder.ApplyAsync(db);
        logger.LogInformation("Imagens ilustradas de fichas aplicadas (idempotente).");
    }
}
