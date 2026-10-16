using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IniciativasRPG.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Lineups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Lineups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CampaignId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Lineups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Lineups_Campaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "Campaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LineupMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    LineupId = table.Column<Guid>(type: "TEXT", nullable: false),
                    SheetId = table.Column<Guid>(type: "TEXT", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LineupMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LineupMembers_Lineups_LineupId",
                        column: x => x.LineupId,
                        principalTable: "Lineups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LineupMembers_Sheets_SheetId",
                        column: x => x.SheetId,
                        principalTable: "Sheets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LineupMembers_LineupId_SheetId",
                table: "LineupMembers",
                columns: new[] { "LineupId", "SheetId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LineupMembers_SheetId",
                table: "LineupMembers",
                column: "SheetId");

            migrationBuilder.CreateIndex(
                name: "IX_Lineups_CampaignId",
                table: "Lineups",
                column: "CampaignId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LineupMembers");

            migrationBuilder.DropTable(
                name: "Lineups");
        }
    }
}
