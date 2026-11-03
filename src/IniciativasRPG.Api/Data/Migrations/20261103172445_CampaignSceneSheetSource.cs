using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IniciativasRPG.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class CampaignSceneSheetSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SheetId",
                table: "CampaignScenes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CampaignScenes_SheetId",
                table: "CampaignScenes",
                column: "SheetId");

            migrationBuilder.AddForeignKey(
                name: "FK_CampaignScenes_Sheets_SheetId",
                table: "CampaignScenes",
                column: "SheetId",
                principalTable: "Sheets",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CampaignScenes_Sheets_SheetId",
                table: "CampaignScenes");

            migrationBuilder.DropIndex(
                name: "IX_CampaignScenes_SheetId",
                table: "CampaignScenes");

            migrationBuilder.DropColumn(
                name: "SheetId",
                table: "CampaignScenes");
        }
    }
}
