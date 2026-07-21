using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Sheet> Sheets => Set<Sheet>();
    public DbSet<Battle> Battles => Set<Battle>();
    public DbSet<Combatant> Combatants => Set<Combatant>();
    public DbSet<ModifierType> ModifierTypes => Set<ModifierType>();
    public DbSet<ActiveModifier> ActiveModifiers => Set<ActiveModifier>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Username).IsUnique();
            e.Property(x => x.Username).HasMaxLength(100).IsRequired();
            e.Property(x => x.PasswordHash).IsRequired();
        });

        modelBuilder.Entity<Sheet>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.ImageUrl).HasMaxLength(1000);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
        });

        modelBuilder.Entity<Battle>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.PublicToken).IsUnique();
            e.Property(x => x.PublicToken).HasMaxLength(64).IsRequired();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        });

        modelBuilder.Entity<Combatant>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Battle)
                .WithMany(b => b.Combatants)
                .HasForeignKey(x => x.BattleId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Sheet)
                .WithMany(s => s.Combatants)
                .HasForeignKey(x => x.SheetId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ModifierType>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(120).IsRequired();
        });

        modelBuilder.Entity<ActiveModifier>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(120).IsRequired();
            e.HasOne(x => x.Combatant)
                .WithMany(c => c.ActiveModifiers)
                .HasForeignKey(x => x.CombatantId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ModifierType)
                .WithMany(t => t.ActiveModifiers)
                .HasForeignKey(x => x.ModifierTypeId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
