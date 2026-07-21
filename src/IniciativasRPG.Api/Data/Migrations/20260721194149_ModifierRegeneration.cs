using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IniciativasRPG.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class ModifierRegeneration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HealAmount",
                table: "ModifierTypes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HealDice",
                table: "ModifierTypes",
                type: "TEXT",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HealMode",
                table: "ModifierTypes",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.AddColumn<int>(
                name: "HealAmount",
                table: "ActiveModifiers",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HealDice",
                table: "ActiveModifiers",
                type: "TEXT",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HealMode",
                table: "ActiveModifiers",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.AddColumn<int>(
                name: "LastTickHeal",
                table: "ActiveModifiers",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ResolvedHeal",
                table: "ActiveModifiers",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HealAmount",
                table: "ModifierTypes");

            migrationBuilder.DropColumn(
                name: "HealDice",
                table: "ModifierTypes");

            migrationBuilder.DropColumn(
                name: "HealMode",
                table: "ModifierTypes");

            migrationBuilder.DropColumn(
                name: "HealAmount",
                table: "ActiveModifiers");

            migrationBuilder.DropColumn(
                name: "HealDice",
                table: "ActiveModifiers");

            migrationBuilder.DropColumn(
                name: "HealMode",
                table: "ActiveModifiers");

            migrationBuilder.DropColumn(
                name: "LastTickHeal",
                table: "ActiveModifiers");

            migrationBuilder.DropColumn(
                name: "ResolvedHeal",
                table: "ActiveModifiers");
        }
    }
}
