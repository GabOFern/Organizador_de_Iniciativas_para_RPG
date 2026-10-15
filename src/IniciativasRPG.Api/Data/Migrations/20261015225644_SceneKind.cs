using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IniciativasRPG.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class SceneKind : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Kind",
                table: "CampaignScenes",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "Uncategorized");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Kind",
                table: "CampaignScenes");
        }
    }
}
