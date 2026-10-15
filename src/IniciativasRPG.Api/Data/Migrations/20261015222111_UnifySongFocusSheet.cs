using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IniciativasRPG.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class UnifySongFocusSheet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Dados: SongFocusSheetUnifier.ApplyAsync roda no DbSeeder após MigrateAsync
            // (unifica Foco da Canção — Pavor/Recomposição/Ruína → Foco da Canção).
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
