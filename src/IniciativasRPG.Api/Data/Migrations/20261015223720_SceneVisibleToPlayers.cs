using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IniciativasRPG.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class SceneVisibleToPlayers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVisibleToPlayers",
                table: "CampaignScenes",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsVisibleToPlayers",
                table: "CampaignScenes");
        }
    }
}
