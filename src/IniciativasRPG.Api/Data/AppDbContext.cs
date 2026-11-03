using IniciativasRPG.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IniciativasRPG.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<Sheet> Sheets => Set<Sheet>();
    public DbSet<SheetFeature> SheetFeatures => Set<SheetFeature>();
    public DbSet<SheetAttack> SheetAttacks => Set<SheetAttack>();
    public DbSet<SheetSpell> SheetSpells => Set<SheetSpell>();
    public DbSet<SheetWeapon> SheetWeapons => Set<SheetWeapon>();
    public DbSet<SheetImage> SheetImages => Set<SheetImage>();
    public DbSet<CampaignScene> CampaignScenes => Set<CampaignScene>();
    public DbSet<CampaignImageTag> CampaignImageTags => Set<CampaignImageTag>();
    public DbSet<CampaignSceneTag> CampaignSceneTags => Set<CampaignSceneTag>();
    public DbSet<Lineup> Lineups => Set<Lineup>();
    public DbSet<LineupMember> LineupMembers => Set<LineupMember>();
    public DbSet<Battle> Battles => Set<Battle>();
    public DbSet<Combatant> Combatants => Set<Combatant>();
    public DbSet<ModifierType> ModifierTypes => Set<ModifierType>();
    public DbSet<ActiveModifier> ActiveModifiers => Set<ActiveModifier>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Campaign>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.PublicToken).IsUnique();
            e.Property(x => x.Name).HasMaxLength(CampaignRules.MaxNameLength).IsRequired();
            e.Property(x => x.ImageUrl).HasMaxLength(CampaignRules.MaxImageUrlLength);
            e.Property(x => x.Description).HasMaxLength(CampaignRules.MaxDescriptionLength);
            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.PublicToken).HasMaxLength(BattleRules.MaxPublicTokenLength).IsRequired();
        });

        modelBuilder.Entity<CampaignScene>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(SceneRules.MaxTitleLength).IsRequired();
            e.Property(x => x.Kind).HasConversion<string>().HasMaxLength(SceneRules.MaxKindLength)
                .HasDefaultValue(SceneRules.KindDefault);
            e.Property(x => x.ImageUrl).HasMaxLength(SceneRules.MaxImageUrlLength);
            e.Property(x => x.ImageContentType).HasMaxLength(SceneRules.MaxImageContentTypeLength);
            e.Property(x => x.IsVisibleToPlayers).HasDefaultValue(SceneRules.VisibleToPlayersDefault);
            e.HasOne(x => x.Campaign)
                .WithMany(c => c.Scenes)
                .HasForeignKey(x => x.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Sheet)
                .WithMany()
                .HasForeignKey(x => x.SheetId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(x => x.CampaignId);
            e.HasIndex(x => x.SheetId);
        });

        modelBuilder.Entity<CampaignImageTag>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name)
                .HasMaxLength(SceneRules.MaxTagNameLength)
                .UseCollation("NOCASE")
                .IsRequired();
            e.HasOne(x => x.Campaign)
                .WithMany(c => c.ImageTags)
                .HasForeignKey(x => x.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.CampaignId, x.Name }).IsUnique();
        });

        modelBuilder.Entity<CampaignSceneTag>(e =>
        {
            e.HasKey(x => new { x.SceneId, x.TagId });
            e.HasOne(x => x.Scene)
                .WithMany(s => s.SceneTags)
                .HasForeignKey(x => x.SceneId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Tag)
                .WithMany(t => t.SceneTags)
                .HasForeignKey(x => x.TagId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.TagId);
        });

        modelBuilder.Entity<Sheet>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(SheetRules.MaxNameLength).IsRequired();
            e.Property(x => x.PlayerName).HasMaxLength(SheetRules.MaxPlayerNameLength);
            e.Property(x => x.ImageUrl).HasMaxLength(SheetRules.MaxImageUrlLength);
            e.Property(x => x.ImageScale).HasDefaultValue(SheetRules.ImageScaleDefault);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(SheetRules.MaxEnumStringLength);
            e.Property(x => x.Class).HasConversion<string>().HasMaxLength(SheetRules.MaxEnumStringLength);
            e.Property(x => x.Resistances).HasMaxLength(SheetRules.MaxResistancesLength);
            e.HasOne(x => x.Campaign)
                .WithMany(c => c.Sheets)
                .HasForeignKey(x => x.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.CampaignId);
        });

        modelBuilder.Entity<SheetImage>(e =>
        {
            e.HasKey(x => x.SheetId);
            e.Property(x => x.Content).IsRequired();
            e.Property(x => x.ContentType).HasMaxLength(SheetRules.MaxImageContentTypeLength).IsRequired();
            e.HasOne(x => x.Sheet)
                .WithOne(s => s.Image)
                .HasForeignKey<SheetImage>(x => x.SheetId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SheetFeature>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Kind).HasConversion<string>().HasMaxLength(SheetRules.MaxEnumStringLength);
            e.Property(x => x.Title).HasMaxLength(SheetFeatureRules.MaxTitleLength).IsRequired();
            e.Property(x => x.Text).HasMaxLength(SheetFeatureRules.MaxAnnotationTextLength).IsRequired();
            e.HasOne(x => x.Sheet)
                .WithMany(s => s.Features)
                .HasForeignKey(x => x.SheetId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.SheetId);
        });

        modelBuilder.Entity<SheetAttack>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Description).HasMaxLength(SheetRules.MaxAttackDescriptionLength).IsRequired();
            e.Property(x => x.DamageDice).HasMaxLength(SheetRules.MaxDiceExpressionLength).IsRequired();
            e.Property(x => x.AbilityBase).HasConversion<string>().HasMaxLength(SheetRules.MaxEnumStringLength);
            e.Property(x => x.StrikeType).HasConversion<string>().HasMaxLength(SheetRules.MaxEnumStringLength);
            e.HasOne(x => x.Sheet)
                .WithMany(s => s.Attacks)
                .HasForeignKey(x => x.SheetId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.SheetId);
        });

        modelBuilder.Entity<SheetSpell>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Description).HasMaxLength(SheetRules.MaxAttackDescriptionLength).IsRequired();
            e.Property(x => x.DamageDice).HasMaxLength(SheetRules.MaxDiceExpressionLength);
            e.Property(x => x.AbilityBase).HasConversion<string>().HasMaxLength(SheetRules.MaxEnumStringLength);
            e.HasOne(x => x.Sheet)
                .WithMany(s => s.Spells)
                .HasForeignKey(x => x.SheetId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.SheetId);
        });

        modelBuilder.Entity<SheetWeapon>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Description).HasMaxLength(SheetRules.MaxAttackDescriptionLength).IsRequired();
            e.Property(x => x.DamageDice).HasMaxLength(SheetRules.MaxDiceExpressionLength).IsRequired();
            e.Property(x => x.Range).HasMaxLength(SheetRules.MaxWeaponRangeLength).IsRequired();
            e.Property(x => x.StrikeType).HasConversion<string>().HasMaxLength(SheetRules.MaxEnumStringLength);
            e.HasOne(x => x.Sheet)
                .WithMany(s => s.Weapons)
                .HasForeignKey(x => x.SheetId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.SheetId);
        });

        modelBuilder.Entity<Lineup>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(LineupRules.MaxNameLength).IsRequired();
            e.HasOne(x => x.Campaign)
                .WithMany(c => c.Lineups)
                .HasForeignKey(x => x.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.CampaignId);
        });

        modelBuilder.Entity<LineupMember>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Quantity).HasDefaultValue(LineupRules.MinQuantity);
            e.HasIndex(x => new { x.LineupId, x.SheetId }).IsUnique();
            e.HasOne(x => x.Lineup)
                .WithMany(l => l.Members)
                .HasForeignKey(x => x.LineupId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Sheet)
                .WithMany()
                .HasForeignKey(x => x.SheetId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Battle>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(SheetRules.MaxEnumStringLength);
            e.Property(x => x.LastActionMessage).HasMaxLength(SheetRules.MaxAttackDescriptionLength);
            e.HasOne(x => x.Campaign)
                .WithMany(c => c.Battles)
                .HasForeignKey(x => x.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.CampaignId);
            e.HasIndex(x => new { x.CampaignId, x.Status });
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
            e.Property(x => x.Name).HasMaxLength(ModifierRules.MaxNameLength).IsRequired();
            e.Property(x => x.IconKey).HasMaxLength(ModifierRules.MaxIconKeyLength).IsRequired();
            e.Property(x => x.IconUrl).HasMaxLength(ModifierRules.MaxIconUrlLength);
            e.Property(x => x.DamageMode).HasConversion<string>().HasMaxLength(SheetRules.MaxEnumStringLength);
            e.Property(x => x.DamageDice).HasMaxLength(SheetRules.MaxDiceExpressionLength);
            e.Property(x => x.HealMode).HasConversion<string>().HasMaxLength(SheetRules.MaxEnumStringLength);
            e.Property(x => x.HealDice).HasMaxLength(SheetRules.MaxDiceExpressionLength);
        });

        modelBuilder.Entity<ActiveModifier>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(ModifierRules.MaxNameLength).IsRequired();
            e.Property(x => x.IconKey).HasMaxLength(ModifierRules.MaxIconKeyLength).IsRequired();
            e.Property(x => x.IconUrl).HasMaxLength(ModifierRules.MaxIconUrlLength);
            e.Property(x => x.DamageMode).HasConversion<string>().HasMaxLength(SheetRules.MaxEnumStringLength);
            e.Property(x => x.DamageDice).HasMaxLength(SheetRules.MaxDiceExpressionLength);
            e.Property(x => x.HealMode).HasConversion<string>().HasMaxLength(SheetRules.MaxEnumStringLength);
            e.Property(x => x.HealDice).HasMaxLength(SheetRules.MaxDiceExpressionLength);
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
