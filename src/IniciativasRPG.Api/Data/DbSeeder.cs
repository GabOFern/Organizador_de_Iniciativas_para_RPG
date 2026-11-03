using IniciativasRPG.Api.Configuration;
using IniciativasRPG.Api.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace IniciativasRPG.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var adminOptions = scope.ServiceProvider.GetRequiredService<IOptions<AdminOptions>>().Value;
        var userHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        await db.Database.MigrateAsync();

        if (!string.IsNullOrWhiteSpace(adminOptions.Username) && !string.IsNullOrWhiteSpace(adminOptions.Password))
        {
            var existingUser = await db.Users.FirstOrDefaultAsync(u => u.Username == adminOptions.Username);
            if (existingUser is null)
            {
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Username = adminOptions.Username
                };
                user.PasswordHash = userHasher.HashPassword(user, adminOptions.Password);
                db.Users.Add(user);
                await db.SaveChangesAsync();
                logger.LogInformation("Usuário admin legado seed criado.");
            }
        }

        await SampleNpcSheetSeeder.ApplyAsync(db);
        logger.LogInformation("Fichas NPC/criatura de exemplo aplicadas (idempotente).");
        await SampleSheetImageSeeder.ApplyAsync(db);
        logger.LogInformation("Imagens ilustradas de fichas aplicadas (idempotente).");
    }
}
