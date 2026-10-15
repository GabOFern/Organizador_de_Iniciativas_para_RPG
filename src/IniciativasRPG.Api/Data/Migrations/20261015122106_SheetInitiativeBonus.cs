using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IniciativasRPG.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class SheetInitiativeBonus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "InitiativeBonus",
                table: "Sheets",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(
                """
                UPDATE Sheets SET InitiativeBonus = DexModifier;
                UPDATE Sheets SET InitiativeBonus = 9 WHERE Name = 'Lysander, o Bibliotecário Noturno';
                UPDATE Sheets SET InitiativeBonus = 6 WHERE Name = 'Sammy, a Guarda Silenciosa';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InitiativeBonus",
                table: "Sheets");
        }
    }
}
