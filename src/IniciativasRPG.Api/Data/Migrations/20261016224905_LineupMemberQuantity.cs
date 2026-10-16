using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IniciativasRPG.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class LineupMemberQuantity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Quantity",
                table: "LineupMembers",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Quantity",
                table: "LineupMembers");
        }
    }
}
