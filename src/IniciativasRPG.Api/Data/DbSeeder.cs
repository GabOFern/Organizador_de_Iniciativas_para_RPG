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
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        await db.Database.EnsureCreatedAsync();

        if (string.IsNullOrWhiteSpace(adminOptions.Username) || string.IsNullOrWhiteSpace(adminOptions.Password))
        {
            throw new InvalidOperationException(
                $"{DomainMessages.ConfigMissing} Configure Admin:Username e Admin:Password.");
        }

        var existing = await db.Users.FirstOrDefaultAsync(u => u.Username == adminOptions.Username);
        if (existing is null)
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = adminOptions.Username
            };
            user.PasswordHash = hasher.HashPassword(user, adminOptions.Password);
            db.Users.Add(user);
            await db.SaveChangesAsync();
            logger.LogInformation("Usuário admin seed criado.");
        }
    }
}
