using Dossier.Api.Data;
using Dossier.Api.Extensions;
using Dossier.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dossier.Api.Controllers;

[ApiController, Route("api/bookings/{bookingId:guid}/timeline"), Authorize]
public class TimelineController(DossierDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(Guid bookingId)
    {
        var pid = User.GetPhotographerId();
        if (!await BookingOwnedBy(bookingId, pid)) return NotFound();

        var timeline = await db.Timelines
            .Include(t => t.Blocks.OrderBy(b => b.SortOrder))
            .FirstOrDefaultAsync(t => t.BookingId == bookingId);

        return timeline is null ? NotFound() : Ok(timeline);
    }

    [HttpPost("blocks")]
    public async Task<IActionResult> AddBlock(Guid bookingId, [FromBody] CreateBlockRequest req)
    {
        var pid = User.GetPhotographerId();
        if (!await BookingOwnedBy(bookingId, pid)) return NotFound();

        var timeline = await db.Timelines.FirstOrDefaultAsync(t => t.BookingId == bookingId);
        if (timeline is null)
        {
            timeline = new Timeline { Id = Guid.NewGuid(), BookingId = bookingId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            db.Timelines.Add(timeline);
            await db.SaveChangesAsync();
        }

        var maxOrder = await db.TimelineBlocks.Where(b => b.TimelineId == timeline.Id).MaxAsync(b => (int?)b.SortOrder) ?? -1;
        var block = new TimelineBlock
        {
            Id              = Guid.NewGuid(),
            TimelineId      = timeline.Id,
            Title           = req.Title,
            StartTime       = req.StartTime,
            DurationMinutes = req.DurationMinutes,
            Location        = req.Location,
            Notes           = req.Notes,
            SortOrder       = maxOrder + 1,
            CreatedAt       = DateTime.UtcNow,
        };

        db.TimelineBlocks.Add(block);
        timeline.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(block);
    }

    [HttpPatch("blocks/{blockId:guid}")]
    public async Task<IActionResult> UpdateBlock(Guid bookingId, Guid blockId, [FromBody] UpdateBlockRequest req)
    {
        var pid = User.GetPhotographerId();
        if (!await BookingOwnedBy(bookingId, pid)) return NotFound();

        var block = await db.TimelineBlocks
            
            .FirstOrDefaultAsync(b => b.Id == blockId);
        if (block is null) return NotFound();

        if (req.Title           is not null) block.Title           = req.Title;
        if (req.StartTime       is not null) block.StartTime       = req.StartTime.Value;
        if (req.DurationMinutes is not null) block.DurationMinutes = req.DurationMinutes.Value;
        if (req.Location        is not null) block.Location        = req.Location;
        if (req.Notes           is not null) block.Notes           = req.Notes;
        if (req.SortOrder       is not null) block.SortOrder       = req.SortOrder.Value;

        await db.SaveChangesAsync();
        return Ok(block);
    }

    [HttpDelete("blocks/{blockId:guid}")]
    public async Task<IActionResult> DeleteBlock(Guid bookingId, Guid blockId)
    {
        var pid = User.GetPhotographerId();
        if (!await BookingOwnedBy(bookingId, pid)) return NotFound();

        var block = await db.TimelineBlocks.FindAsync(blockId);
        if (block is null) return NotFound();

        db.TimelineBlocks.Remove(block);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> BookingOwnedBy(Guid bookingId, Guid pid) =>
        await db.Bookings.AnyAsync(b => b.Id == bookingId && b.PhotographerId == pid);
}

public record CreateBlockRequest(
    string   Title,
    TimeOnly StartTime,
    int      DurationMinutes = 60,
    string?  Location        = null,
    string?  Notes           = null
);

public record UpdateBlockRequest(
    string?   Title           = null,
    TimeOnly? StartTime       = null,
    int?      DurationMinutes = null,
    string?   Location        = null,
    string?   Notes           = null,
    int?      SortOrder       = null
);