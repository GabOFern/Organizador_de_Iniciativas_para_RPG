using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IniciativasRPG.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class CampaignsAndSheetAttrs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Battles_PublicToken",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "PublicToken",
                table: "Battles");

            migrationBuilder.AddColumn<Guid>(
                name: "CampaignId",
                table: "Sheets",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "Charisma",
                table: "Sheets",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Class",
                table: "Sheets",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Constitution",
                table: "Sheets",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Dexterity",
                table: "Sheets",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Intelligence",
                table: "Sheets",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Resistances",
                table: "Sheets",
                type: "TEXT",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Strength",
                table: "Sheets",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Wisdom",
                table: "Sheets",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "CampaignId",
                table: "Battles",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "Campaigns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    ImageUrl = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Description = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: false),
                    PublicToken = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Campaigns", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Sheets_CampaignId",
                table: "Sheets",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_Battles_CampaignId",
                table: "Battles",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_Battles_CampaignId_Status",
                table: "Battles",
                columns: new[] { "CampaignId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Campaigns_PublicToken",
                table: "Campaigns",
                column: "PublicToken",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Battles_Campaigns_CampaignId",
                table: "Battles",
                column: "CampaignId",
                principalTable: "Campaigns",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Sheets_Campaigns_CampaignId",
                table: "Sheets",
                column: "CampaignId",
                principalTable: "Campaigns",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Battles_Campaigns_CampaignId",
                table: "Battles");

            migrationBuilder.DropForeignKey(
                name: "FK_Sheets_Campaigns_CampaignId",
                table: "Sheets");

            migrationBuilder.DropTable(
                name: "Campaigns");

            migrationBuilder.DropIndex(
                name: "IX_Sheets_CampaignId",
                table: "Sheets");

            migrationBuilder.DropIndex(
                name: "IX_Battles_CampaignId",
                table: "Battles");

            migrationBuilder.DropIndex(
                name: "IX_Battles_CampaignId_Status",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "CampaignId",
                table: "Sheets");

            migrationBuilder.DropColumn(
                name: "Charisma",
                table: "Sheets");

            migrationBuilder.DropColumn(
                name: "Class",
                table: "Sheets");

            migrationBuilder.DropColumn(
                name: "Constitution",
                table: "Sheets");

            migrationBuilder.DropColumn(
                name: "Dexterity",
                table: "Sheets");

            migrationBuilder.DropColumn(
                name: "Intelligence",
                table: "Sheets");

            migrationBuilder.DropColumn(
                name: "Resistances",
                table: "Sheets");

            migrationBuilder.DropColumn(
                name: "Strength",
                table: "Sheets");

            migrationBuilder.DropColumn(
                name: "Wisdom",
                table: "Sheets");

            migrationBuilder.DropColumn(
                name: "CampaignId",
                table: "Battles");

            migrationBuilder.AddColumn<string>(
                name: "PublicToken",
                table: "Battles",
                type: "TEXT",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Battles_PublicToken",
                table: "Battles",
                column: "PublicToken",
                unique: true);
        }
    }
}
