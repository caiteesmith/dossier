using System.Text.Json;
using Dossier.Api.Data;
using Dossier.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dossier.Api.Controllers;

[ApiController, Route("api/portal")]
public class PortalController(DossierDbContext db) : ControllerBase
{
    private static readonly Dictionary<string, string> VendorFieldMap = new()
    {
        ["vendor_planner"]      = "Planner",
        ["vendor_officiant"]    = "Officiant",
        ["vendor_videographer"] = "Videographer",
        ["vendor_caterer"]      = "Caterer",
        ["vendor_bakery"]       = "Baker/Cake",
        ["vendor_florist"]      = "Florist",
        ["vendor_hair"]         = "Hair",
        ["vendor_makeup"]       = "Makeup",
        ["vendor_dj_band"]      = "DJ/Band",
    };

    // GET api/portal/{token}
    [HttpGet("{token:guid}")]
    public async Task<IActionResult> GetByToken(Guid token)
    {
        var booking = await db.Bookings
            .FirstOrDefaultAsync(b => b.PortalToken == token && b.PortalEnabled);
        if (booking is null) return NotFound();

        var tasks = await db.Tasks
            .Where(t => t.BookingId == booking.Id)
            .OrderBy(t => t.SortOrder)
            .ToListAsync();

        var vendors = await db.Vendors
            .Where(v => v.BookingId == booking.Id)
            .OrderBy(v => v.SortOrder)
            .ToListAsync();

        var timeline = await db.Timelines
            .Include(t => t.Blocks.OrderBy(b => b.SortOrder))
            .FirstOrDefaultAsync(t => t.BookingId == booking.Id);

        var questionnaireResponse = await db.QuestionnaireResponses
            .FirstOrDefaultAsync(q => q.BookingId == booking.Id);

        var photographer = await db.Photographers
            .FirstOrDefaultAsync(p => p.Id == booking.PhotographerId);

        return Ok(new
        {
            booking.Id,
            booking.PartnerOneName,
            booking.PartnerTwoName,
            booking.Email,
            booking.Phone,
            WeddingDate              = booking.WeddingDate.ToString("yyyy-MM-dd"),
            booking.VenueName,
            booking.VenueAddress,
            booking.VenueLat,
            booking.VenueLng,
            booking.PackageName,
            booking.PackagePrice,
            booking.HoursCovered,
            booking.Notes,
            AddOns = string.IsNullOrEmpty(booking.AddOns) || booking.AddOns == "[]"
                ? null
                : JsonSerializer.Deserialize<object>(booking.AddOns),
            PortalToken              = booking.PortalToken.ToString(),
            booking.PortalEnabled,
            Status                   = booking.Status.ToString().ToLower(),
            Tasks                    = tasks,
            Vendors                  = vendors,
            Timeline                 = timeline,
            ShotListGroups           = new List<object>(),
            QuestionnaireAnswers     = questionnaireResponse?.Answers,
            QuestionnaireSubmittedAt = questionnaireResponse?.SubmittedAt,
            Photographer = photographer is null ? null : new
            {
                photographer.FirstName,
                photographer.LastName,
                FullName = $"{photographer.FirstName} {photographer.LastName}".Trim(),
                photographer.BusinessName,
                photographer.Email,
                photographer.Phone,
                photographer.Website,
                photographer.Instagram,
                photographer.GalleryDeliveryWeeks,
                photographer.GalleryDeliveryWeeksMax,
            },
        });
    }

    // GET api/portal/{token}/questionnaire
    [HttpGet("{token:guid}/questionnaire")]
    public async Task<IActionResult> GetQuestionnaire(Guid token)
    {
        var booking = await db.Bookings.FirstOrDefaultAsync(b => b.PortalToken == token && b.PortalEnabled);
        if (booking is null) return NotFound();

        var response = await db.QuestionnaireResponses
            .FirstOrDefaultAsync(q => q.BookingId == booking.Id);

        var vendors = await db.Vendors
            .Where(v => v.BookingId == booking.Id)
            .ToListAsync();

        // Start with saved answers or empty dict
        var answers = response is not null && !string.IsNullOrEmpty(response.Answers)
            ? JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(response.Answers)
              ?? new Dictionary<string, JsonElement>()
            : new Dictionary<string, JsonElement>();

        // Pre-fill vendor fields from booking vendors where answer is missing/empty
        foreach (var (fieldId, role) in VendorFieldMap)
        {
            var hasAnswer = answers.TryGetValue(fieldId, out var existing) &&
                            existing.ValueKind == JsonValueKind.String &&
                            !string.IsNullOrWhiteSpace(existing.GetString());
            if (!hasAnswer)
            {
                var vendor = vendors.FirstOrDefault(v =>
                    string.Equals(v.Role, role, StringComparison.OrdinalIgnoreCase));
                if (vendor is not null)
                    answers[fieldId] = JsonSerializer.SerializeToElement(vendor.Name);
            }
        }

        return Ok(new { answers, submittedAt = response?.SubmittedAt });
    }

    // POST api/portal/{token}/questionnaire
    [HttpPost("{token:guid}/questionnaire")]
    public async Task<IActionResult> SaveQuestionnaire(Guid token)
    {
        Request.EnableBuffering();
        using var reader = new System.IO.StreamReader(Request.Body, leaveOpen: true);
        var rawBody = await reader.ReadToEndAsync();
        Request.Body.Position = 0;

        if (string.IsNullOrWhiteSpace(rawBody)) return BadRequest("Empty body");

        PortalSaveRequest? req;
        try
        {
            req = JsonSerializer.Deserialize<PortalSaveRequest>(rawBody,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (Exception ex) { return BadRequest($"Parse error: {ex.Message}"); }

        if (req is null) return BadRequest("Could not parse request");

        var booking = await db.Bookings.FirstOrDefaultAsync(b => b.PortalToken == token && b.PortalEnabled);
        if (booking is null) return NotFound();

        var answersJson = req.Answers.ValueKind != JsonValueKind.Undefined
            ? req.Answers.GetRawText()
            : "{}";

        // ── Sync vendors from questionnaire into booking vendors ──────
        using var answersDoc = JsonDocument.Parse(answersJson);
        var existingVendors = await db.Vendors.Where(v => v.BookingId == booking.Id).ToListAsync();
        var maxOrder = existingVendors.Any() ? existingVendors.Max(v => v.SortOrder) : -1;

        foreach (var (fieldId, role) in VendorFieldMap)
        {
            if (!answersDoc.RootElement.TryGetProperty(fieldId, out var val)) continue;
            var name = val.ValueKind == JsonValueKind.String ? val.GetString()?.Trim() : null;
            if (string.IsNullOrEmpty(name) || name.Equals("TBD", StringComparison.OrdinalIgnoreCase)) continue;

            var existing = existingVendors.FirstOrDefault(v =>
                string.Equals(v.Role, role, StringComparison.OrdinalIgnoreCase));

            if (existing is null)
            {
                db.Vendors.Add(new Vendor
                {
                    Id        = Guid.NewGuid(),
                    BookingId = booking.Id,
                    Role      = role,
                    Name      = name,
                    SortOrder = ++maxOrder,
                    CreatedAt = DateTime.UtcNow,
                });
            }
            // Photographer-side data wins — don't overwrite existing vendors
        }

        // ── Save questionnaire response ───────────────────────────────
        var response = await db.QuestionnaireResponses
            .FirstOrDefaultAsync(q => q.BookingId == booking.Id);

        if (response is null)
        {
            response = new QuestionnaireResponse
            {
                Id          = Guid.NewGuid(),
                BookingId   = booking.Id,
                Answers     = answersJson,
                SubmittedAt = req.Submit ? DateTime.UtcNow : null,
                CreatedAt   = DateTime.UtcNow,
                UpdatedAt   = DateTime.UtcNow,
            };
            db.QuestionnaireResponses.Add(response);
        }
        else
        {
            response.Answers   = answersJson;
            response.UpdatedAt = DateTime.UtcNow;
            if (req.Submit && response.SubmittedAt is null)
                response.SubmittedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        return Ok(new { answers = JsonSerializer.Deserialize<object>(response.Answers), response.SubmittedAt });
    }
}

public class PortalSaveRequest
{
    public JsonElement Answers { get; set; }
    public bool Submit { get; set; } = false;
}