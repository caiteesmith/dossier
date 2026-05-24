using Dossier.Api.Data;
using Dossier.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dossier.Api.Controllers;

// No [Authorize] — portal is token-based, not JWT
[ApiController, Route("api/portal")]
public class PortalController(DossierDbContext db) : ControllerBase
{
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

        return Ok(new
        {
            booking.Id,
            booking.PartnerOneName,
            booking.PartnerTwoName,
            booking.Email,
            booking.Phone,
            WeddingDate  = booking.WeddingDate.ToString("yyyy-MM-dd"),
            booking.VenueName,
            booking.VenueAddress,
            booking.VenueLat,
            booking.VenueLng,
            booking.PackageName,
            booking.PackagePrice,
            booking.HoursCovered,
            booking.Notes,
            PortalToken  = booking.PortalToken.ToString(),
            booking.PortalEnabled,
            Status       = booking.Status.ToString().ToLower(),
            Tasks        = tasks,
            Vendors      = vendors,
            Timeline     = timeline,
            ShotListGroups = new List<object>(), // not exposed to clients
            QuestionnaireAnswers = questionnaireResponse?.Answers,
            QuestionnaireSubmittedAt = questionnaireResponse?.SubmittedAt,
        });
    }

    // POST api/portal/{token}/questionnaire
    [HttpPost("{token:guid}/questionnaire")]
    public async Task<IActionResult> SubmitQuestionnaire(Guid token, [FromBody] SubmitQuestionnaireRequest req)
    {
        var booking = await db.Bookings
            .FirstOrDefaultAsync(b => b.PortalToken == token && b.PortalEnabled);
        if (booking is null) return NotFound();

        var existing = await db.QuestionnaireResponses
            .FirstOrDefaultAsync(q => q.BookingId == booking.Id);

        if (existing is null)
        {
            existing = new QuestionnaireResponse
            {
                Id        = Guid.NewGuid(),
                BookingId = booking.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            db.QuestionnaireResponses.Add(existing);
        }

        existing.Answers     = req.Answers;
        existing.SubmittedAt = DateTime.UtcNow;
        existing.UpdatedAt   = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(new { submitted = true });
    }
}

public record SubmitQuestionnaireRequest(string Answers);