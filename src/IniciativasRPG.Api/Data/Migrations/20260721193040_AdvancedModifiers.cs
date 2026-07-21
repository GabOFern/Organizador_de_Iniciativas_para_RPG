using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IniciativasRPG.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AdvancedModifiers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AcDelta",
                table: "ModifierTypes",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DamageAmount",
                table: "ModifierTypes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DamageDice",
                table: "ModifierTypes",
                type: "TEXT",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DamageMode",
                table: "ModifierTypes",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.AddColumn<string>(
                name: "IconKey",
                table: "ModifierTypes",
                type: "TEXT",
                maxLength: 40,
                nullable: false,
                defaultValue: "generic");

            migrationBuilder.AddColumn<string>(
                name: "IconUrl",
                table: "ModifierTypes",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BaseAc",
                table: "Combatants",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "AcDelta",
                table: "ActiveModifiers",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DamageAmount",
                table: "ActiveModifiers",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DamageDice",
                table: "ActiveModifiers",
                type: "TEXT",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DamageMode",
                table: "ActiveModifiers",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.AddColumn<string>(
                name: "IconKey",
                table: "ActiveModifiers",
                type: "TEXT",
                maxLength: 40,
                nullable: false,
                defaultValue: "generic");

            migrationBuilder.AddColumn<string>(
                name: "IconUrl",
                table: "ActiveModifiers",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LastTickDamage",
                table: "ActiveModifiers",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ResolvedDamage",
                table: "ActiveModifiers",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.Sql("UPDATE Combatants SET BaseAc = CurrentAc WHERE BaseAc = 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcDelta",
                table: "ModifierTypes");

            migrationBuilder.DropColumn(
                name: "DamageAmount",
                table: "ModifierTypes");

            migrationBuilder.DropColumn(
                name: "DamageDice",
                table: "ModifierTypes");

            migrationBuilder.DropColumn(
                name: "DamageMode",
                table: "ModifierTypes");

            migrationBuilder.DropColumn(
                name: "IconKey",
                table: "ModifierTypes");

            migrationBuilder.DropColumn(
                name: "IconUrl",
                table: "ModifierTypes");

            migrationBuilder.DropColumn(
                name: "BaseAc",
                table: "Combatants");

            migrationBuilder.DropColumn(
                name: "AcDelta",
                table: "ActiveModifiers");

            migrationBuilder.DropColumn(
                name: "DamageAmount",
                table: "ActiveModifiers");

            migrationBuilder.DropColumn(
                name: "DamageDice",
                table: "ActiveModifiers");

            migrationBuilder.DropColumn(
                name: "DamageMode",
                table: "ActiveModifiers");

            migrationBuilder.DropColumn(
                name: "IconKey",
                table: "ActiveModifiers");

            migrationBuilder.DropColumn(
                name: "IconUrl",
                table: "ActiveModifiers");

            migrationBuilder.DropColumn(
                name: "LastTickDamage",
                table: "ActiveModifiers");

            migrationBuilder.DropColumn(
                name: "ResolvedDamage",
                table: "ActiveModifiers");
        }
    }
}
