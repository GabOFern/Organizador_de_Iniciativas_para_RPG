using System.Security.Cryptography;
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
        var campaignSeed = scope.ServiceProvider.GetRequiredService<IOptions<CampaignSeedOptions>>().Value;
        var userHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
        var campaignHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Campaign>>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        await db.Database.MigrateAsync();
        await SongFocusSheetUnifier.ApplyAsync(db);
        logger.LogInformation("Unificação Foco da Canção aplicada (idempotente).");

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

        if (!await db.Campaigns.AnyAsync())
        {
            var password = !string.IsNullOrWhiteSpace(campaignSeed.Password)
                ? campaignSeed.Password
                : adminOptions.Password;

            if (string.IsNullOrWhiteSpace(password))
            {
                throw new InvalidOperationException(
                    $"{DomainMessages.ConfigMissing} Configure CampaignSeed:Password (ou Admin:Password).");
            }

            var campaign = new Campaign
            {
                Id = Guid.NewGuid(),
                Name = string.IsNullOrWhiteSpace(campaignSeed.Name) ? "Campanha inicial" : campaignSeed.Name.Trim(),
                PublicToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(BattleRules.PublicTokenLength))
                    .ToLowerInvariant(),
                CreatedAtUtc = DateTime.UtcNow
            };
            campaign.PasswordHash = campaignHasher.HashPassword(campaign, password);
            db.Campaigns.Add(campaign);
            await db.SaveChangesAsync();

            var orphanSheets = await db.Sheets.Where(s => s.CampaignId == Guid.Empty).ToListAsync();
            foreach (var sheet in orphanSheets)
            {
                sheet.CampaignId = campaign.Id;
            }

            var orphanBattles = await db.Battles.Where(b => b.CampaignId == Guid.Empty).ToListAsync();
            foreach (var battle in orphanBattles)
            {
                battle.CampaignId = campaign.Id;
            }

            if (orphanSheets.Count > 0 || orphanBattles.Count > 0)
            {
                await db.SaveChangesAsync();
            }

            logger.LogInformation("Campanha seed criada: {Name}", campaign.Name);
        }

        await SampleNpcSheetSeeder.ApplyAsync(db);
        logger.LogInformation("Fichas NPC/criatura de exemplo aplicadas (idempotente).");
        await SampleSheetImageSeeder.ApplyAsync(db);
        logger.LogInformation("Imagens ilustradas de fichas aplicadas (idempotente).");
    }
}
