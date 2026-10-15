using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IniciativasRPG.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class SheetProficiencyBonus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProficiencyBonus",
                table: "Sheets",
                type: "INTEGER",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.Sql(
                """
                UPDATE Sheets SET ProficiencyBonus = 7 WHERE Name = 'Lysander, o Bibliotecário Noturno';
                UPDATE Sheets SET ProficiencyBonus = 4 WHERE Name = 'Sammy, a Guarda Silenciosa';
                UPDATE Sheets SET ProficiencyBonus = 5 WHERE Name = 'Falsa Hidra';
                UPDATE Sheets SET ProficiencyBonus = 3 WHERE Name = 'Revenante';
                UPDATE Sheets SET ProficiencyBonus = 3 WHERE Name = 'Flor Cadavérica';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProficiencyBonus",
                table: "Sheets");
        }
    }
}
