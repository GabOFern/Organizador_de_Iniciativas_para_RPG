using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IniciativasRPG.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class SheetImageFocus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "ImageFocusX",
                table: "Sheets",
                type: "REAL",
                nullable: false,
                defaultValue: 50.0);

            migrationBuilder.AddColumn<double>(
                name: "ImageFocusY",
                table: "Sheets",
                type: "REAL",
                nullable: false,
                defaultValue: 50.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageFocusX",
                table: "Sheets");

            migrationBuilder.DropColumn(
                name: "ImageFocusY",
                table: "Sheets");
        }
    }
}
