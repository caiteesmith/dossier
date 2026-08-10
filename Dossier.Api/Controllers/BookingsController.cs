using System.Text.Json;
using Dossier.Api.Data;
using Dossier.Api.Extensions;
using Dossier.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dossier.Api.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class BookingsController(DossierDbContext db, Supabase.Client supabase) : ControllerBase
{
    // GET api/bookings
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var pid = User.GetPhotographerId();
        var bookings = await db.Bookings
            .Where(b => b.PhotographerId == pid)
            .OrderBy(b => b.WeddingDate)
            .ToListAsync();
        return Ok(bookings.Select(b => new {
            b.Id,
            b.PhotographerId,
            b.LeadId,
            b.PartnerOneName,
            b.PartnerTwoName,
            b.Email,
            b.Phone,
            WeddingDate = b.WeddingDate.ToString("yyyy-MM-dd"),
            b.VenueName,
            b.PackageName,
            b.PackagePrice,
            b.HoursCovered,
            Status = b.Status.ToString().ToLower(),
            b.WorkflowStatus,
            PortalToken = b.PortalToken.ToString(),
            b.PortalEnabled,
            b.Notes,
            b.CouplePhotoUrl,
            b.CreatedAt,
            b.UpdatedAt,
        }));
    }

    // GET api/bookings/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var pid = User.GetPhotographerId();
        var booking = await db.Bookings
            .FirstOrDefaultAsync(b => b.Id == id && b.PhotographerId == pid);
        if (booking is null) return NotFound();

        var tasks = await db.Tasks
            .Where(t => t.BookingId == id)
            .OrderBy(t => t.SortOrder)
            .ToListAsync();

        var vendors = await db.Vendors
            .Where(v => v.BookingId == id)
            .OrderBy(v => v.SortOrder)
            .ToListAsync();

        var timeline = await db.Timelines
            .Include(t => t.Blocks.OrderBy(b => b.SortOrder))
            .FirstOrDefaultAsync(t => t.BookingId == id);

        var shotList = await db.ShotLists
            .Include(s => s.Groups.OrderBy(g => g.SortOrder))
            .ThenInclude(g => g.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(s => s.BookingId == id);

        return Ok(new
        {
            booking.Id,
            booking.PhotographerId,
            booking.LeadId,
            booking.PartnerOneName,
            booking.PartnerTwoName,
            booking.PartnerOneLegalName,
            booking.PartnerTwoLegalName,
            booking.MarriedSurname,
            booking.Email,
            booking.Phone,
            booking.MailingAddress,
            booking.MailingCity,
            booking.MailingState,
            booking.MailingZip,
            WeddingDate = booking.WeddingDate.ToString("yyyy-MM-dd"),
            booking.VenueName,
            booking.VenueAddress,
            booking.VenueLat,
            booking.VenueLng,
            booking.PackageName,
            booking.PackagePrice,
            booking.HoursCovered,
            Status = booking.Status.ToString().ToLower(),
            booking.WorkflowStatus,
            PortalToken = booking.PortalToken.ToString(),
            booking.PortalEnabled,
            booking.Notes,
            booking.CouplePhotoUrl,
            booking.GalleryStageIndex,
            booking.GalleryStages,
            DayOfDetails = string.IsNullOrEmpty(booking.DayOfDetails) || booking.DayOfDetails == "{}"
                ? null
                : JsonSerializer.Deserialize<object>(booking.DayOfDetails),
            AddOns = string.IsNullOrEmpty(booking.AddOns) || booking.AddOns == "[]"
                ? null
                : JsonSerializer.Deserialize<object>(booking.AddOns),
            booking.CreatedAt,
            booking.UpdatedAt,
            Tasks          = tasks,
            Vendors        = vendors,
            Timeline       = timeline,
            ShotListGroups = shotList?.Groups ?? [],
        });
    }

    // POST api/bookings
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest req)
    {
        var pid = User.GetPhotographerId();
        var booking = new Booking
        {
            Id                  = Guid.NewGuid(),
            PhotographerId      = pid,
            LeadId              = req.LeadId,
            PartnerOneName      = req.PartnerOneName,
            PartnerTwoName      = req.PartnerTwoName,
            PartnerOneLegalName = req.PartnerOneLegalName,
            PartnerTwoLegalName = req.PartnerTwoLegalName,
            MarriedSurname      = req.MarriedSurname,
            Email               = req.Email,
            Phone               = req.Phone,
            MailingAddress      = req.MailingAddress,
            MailingCity         = req.MailingCity,
            MailingState        = req.MailingState,
            MailingZip          = req.MailingZip,
            WeddingDate         = req.WeddingDate,
            VenueName           = req.VenueName,
            VenueAddress        = req.VenueAddress,
            VenueLat            = req.VenueLat,
            VenueLng            = req.VenueLng,
            PackageName         = req.PackageName,
            PackagePrice        = req.PackagePrice,
            HoursCovered        = req.HoursCovered,
            Status              = BookingStatus.Booked,
            WorkflowStatus      = "booked",
            PortalToken         = Guid.NewGuid(),
            PortalEnabled       = true,
            Notes               = req.Notes,
            CreatedAt           = DateTime.UtcNow,
            UpdatedAt           = DateTime.UtcNow,
        };

        db.Bookings.Add(booking);

        if (req.LeadId.HasValue)
        {
            var lead = await db.Leads.FindAsync(req.LeadId.Value);
            if (lead?.PhotographerId == pid)
            {
                lead.Status    = LeadStatus.Booked;
                lead.UpdatedAt = DateTime.UtcNow;
            }
        }

        await db.SaveChangesAsync();
        await SeedMilestoneTasks(booking.Id, pid);

        return CreatedAtAction(nameof(GetById), new { id = booking.Id }, new { booking.Id });
    }

    // PATCH api/bookings/{id}
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBookingRequest req)
    {
        var pid = User.GetPhotographerId();
        var booking = await db.Bookings
            .FirstOrDefaultAsync(b => b.Id == id && b.PhotographerId == pid);
        if (booking is null) return NotFound();

        if (req.PartnerOneName      is not null) booking.PartnerOneName      = req.PartnerOneName;
        if (req.PartnerTwoName      is not null) booking.PartnerTwoName      = req.PartnerTwoName;
        if (req.PartnerOneLegalName is not null) booking.PartnerOneLegalName = req.PartnerOneLegalName;
        if (req.PartnerTwoLegalName is not null) booking.PartnerTwoLegalName = req.PartnerTwoLegalName;
        if (req.MarriedSurname      is not null) booking.MarriedSurname      = req.MarriedSurname;
        if (req.Email               is not null) booking.Email               = req.Email;
        if (req.Phone               is not null) booking.Phone               = req.Phone;
        if (req.MailingAddress      is not null) booking.MailingAddress      = req.MailingAddress;
        if (req.MailingCity         is not null) booking.MailingCity         = req.MailingCity;
        if (req.MailingState        is not null) booking.MailingState        = req.MailingState;
        if (req.MailingZip          is not null) booking.MailingZip          = req.MailingZip;
        if (req.WeddingDate         is not null) booking.WeddingDate         = req.WeddingDate.Value;
        if (req.VenueName           is not null) booking.VenueName           = req.VenueName;
        if (req.VenueAddress        is not null) booking.VenueAddress        = req.VenueAddress;
        if (req.VenueLat            is not null) booking.VenueLat            = req.VenueLat;
        if (req.VenueLng            is not null) booking.VenueLng            = req.VenueLng;
        if (req.PackageName         is not null) booking.PackageName         = req.PackageName;
        if (req.PackagePrice        is not null) booking.PackagePrice        = req.PackagePrice;
        if (req.HoursCovered        is not null) booking.HoursCovered        = req.HoursCovered;
        if (req.Status              is not null) booking.Status              = req.Status.Value;
        if (req.Notes               is not null) booking.Notes               = req.Notes;
        if (req.CouplePhotoUrl      is not null) booking.CouplePhotoUrl      = req.CouplePhotoUrl;
        if (req.GalleryStageIndex   is not null) booking.GalleryStageIndex   = req.GalleryStageIndex.Value;
        if (req.GalleryStages       is not null) booking.GalleryStages       = req.GalleryStages;
        if (req.WorkflowStatus       is not null) booking.WorkflowStatus      = req.WorkflowStatus;
        if (req.DayOfDetails        is not null && req.DayOfDetails.Value.ValueKind != JsonValueKind.Undefined)
            booking.DayOfDetails = req.DayOfDetails.Value.GetRawText();
        if (req.AddOns              is not null && req.AddOns.Value.ValueKind != JsonValueKind.Undefined)
            booking.AddOns = req.AddOns.Value.GetRawText();

        booking.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(booking);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var pid = User.GetPhotographerId();
        var booking = await db.Bookings
            .FirstOrDefaultAsync(b => b.Id == id && b.PhotographerId == pid);
        if (booking is null) return NotFound();
        db.Bookings.Remove(booking);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task SeedMilestoneTasks(Guid bookingId, Guid photographerId)
    {
        var milestones = new[]
        {
            ("Send contract",                        TaskCategory.Admin),
            ("Collect deposit",                      TaskCategory.Admin),
            ("Confirm final timeline and shot list", TaskCategory.Client),
            ("Review questionnaire responses",       TaskCategory.Admin),
            ("Build shot list",                      TaskCategory.Admin),
            ("Build timeline",                       TaskCategory.Admin),
            ("Confirm second shooter",               TaskCategory.DayOf),
            ("Collect final payment",                TaskCategory.Admin),
            ("Deliver gallery",                      TaskCategory.PostWedding),
        };

        var tasks = milestones.Select((m, i) => new Task_
        {
            Id             = Guid.NewGuid(),
            BookingId      = bookingId,
            PhotographerId = photographerId,
            Title          = m.Item1,
            Category       = m.Item2,
            IsAuto         = true,
            SortOrder      = i,
            CreatedAt      = DateTime.UtcNow,
            UpdatedAt      = DateTime.UtcNow,
        });

        db.Tasks.AddRange(tasks);
        await db.SaveChangesAsync();
    }

    // POST api/bookings/{id}/photo
    [HttpPost("{id:guid}/photo")]
    [RequestSizeLimit(10_000_000)] // 10MB
    public async Task<IActionResult> UploadPhoto(Guid id, IFormFile file)
    {
        var pid = User.GetPhotographerId();
        var booking = await db.Bookings
            .FirstOrDefaultAsync(b => b.Id == id && b.PhotographerId == pid);
        if (booking is null) return NotFound();

        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest(new { error = "File must be JPEG, PNG, or WebP." });

        var ext = Path.GetExtension(file.FileName);
        var path = $"{id}/{Guid.NewGuid()}{ext}";

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);

        await supabase.Storage
            .From("booking-photos")
            .Upload(ms.ToArray(), path, new Supabase.Storage.FileOptions { ContentType = file.ContentType, Upsert = true });

        var publicUrl = supabase.Storage.From("booking-photos").GetPublicUrl(path);

        booking.CouplePhotoUrl = publicUrl;
        booking.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { url = publicUrl });
    }

    // DELETE api/bookings/{id}/photo
    [HttpDelete("{id:guid}/photo")]
    public async Task<IActionResult> DeletePhoto(Guid id)
    {
        var pid = User.GetPhotographerId();
        var booking = await db.Bookings
            .FirstOrDefaultAsync(b => b.Id == id && b.PhotographerId == pid);
        if (booking is null) return NotFound();

        booking.CouplePhotoUrl = null;
        booking.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return NoContent();
    }
}

public record CreateBookingRequest(
    string   PartnerOneName,
    string   PartnerTwoName,
    string   Email,
    DateOnly WeddingDate,
    string   VenueName,
    Guid?    LeadId              = null,
    string?  PartnerOneLegalName = null,
    string?  PartnerTwoLegalName = null,
    string?  MarriedSurname      = null,
    string?  Phone               = null,
    string?  MailingAddress      = null,
    string?  MailingCity         = null,
    string?  MailingState        = null,
    string?  MailingZip          = null,
    string?  VenueAddress        = null,
    decimal? VenueLat            = null,
    decimal? VenueLng            = null,
    string?  PackageName         = null,
    decimal? PackagePrice        = null,
    decimal? HoursCovered        = null,
    string?  Notes               = null
);

public record UpdateBookingRequest(
    string?        PartnerOneName      = null,
    string?        PartnerTwoName      = null,
    string?        PartnerOneLegalName = null,
    string?        PartnerTwoLegalName = null,
    string?        MarriedSurname      = null,
    string?        Email               = null,
    string?        Phone               = null,
    string?        MailingAddress      = null,
    string?        MailingCity         = null,
    string?        MailingState        = null,
    string?        MailingZip          = null,
    DateOnly?      WeddingDate         = null,
    string?        VenueName           = null,
    string?        VenueAddress        = null,
    decimal?       VenueLat            = null,
    decimal?       VenueLng            = null,
    string?        PackageName         = null,
    decimal?       PackagePrice        = null,
    decimal?       HoursCovered        = null,
    BookingStatus? Status              = null,
    string?        Notes               = null,
    string?        CouplePhotoUrl      = null,
    int?           GalleryStageIndex   = null,
    string?        GalleryStages       = null,
    string?        WorkflowStatus      = null,
    JsonElement?   DayOfDetails        = null,
    JsonElement?   AddOns              = null
);