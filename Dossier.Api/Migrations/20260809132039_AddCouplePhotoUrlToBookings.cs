using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dossier.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCouplePhotoUrlToBookings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "couple_photo_url",
                table: "bookings",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "couple_photo_url",
                table: "bookings");
        }
    }
}
