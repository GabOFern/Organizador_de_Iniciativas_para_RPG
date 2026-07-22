using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IniciativasRPG.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class SheetAttacksSpellsWeapons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SheetAttacks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    SheetId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    DamageDice = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    AbilityBase = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    StrikeType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SheetAttacks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SheetAttacks_Sheets_SheetId",
                        column: x => x.SheetId,
                        principalTable: "Sheets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SheetSpells",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    SheetId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    DamageDice = table.Column<string>(type: "TEXT", maxLength: 40, nullable: true),
                    SlotLevel = table.Column<int>(type: "INTEGER", nullable: false),
                    RequiresMaterial = table.Column<bool>(type: "INTEGER", nullable: false),
                    AbilityBase = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SheetSpells", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SheetSpells_Sheets_SheetId",
                        column: x => x.SheetId,
                        principalTable: "Sheets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SheetWeapons",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    SheetId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    DamageDice = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    Range = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    StrikeType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SheetWeapons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SheetWeapons_Sheets_SheetId",
                        column: x => x.SheetId,
                        principalTable: "Sheets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SheetAttacks_SheetId",
                table: "SheetAttacks",
                column: "SheetId");

            migrationBuilder.CreateIndex(
                name: "IX_SheetSpells_SheetId",
                table: "SheetSpells",
                column: "SheetId");

            migrationBuilder.CreateIndex(
                name: "IX_SheetWeapons_SheetId",
                table: "SheetWeapons",
                column: "SheetId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SheetAttacks");

            migrationBuilder.DropTable(
                name: "SheetSpells");

            migrationBuilder.DropTable(
                name: "SheetWeapons");
        }
    }
}
