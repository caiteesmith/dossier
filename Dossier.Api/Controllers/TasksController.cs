using Dossier.Api.Data;
using Dossier.Api.Extensions;
using Dossier.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dossier.Api.Controllers;

[ApiController, Route("api/bookings/{bookingId:guid}/tasks"), Authorize]
public class TasksController(DossierDbContext db) : ControllerBase
{
    // GET api/bookings/{bookingId}/tasks
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid bookingId)
    {
        var pid = User.GetPhotographerId();
        if (!await BookingBelongsToPhotographer(bookingId, pid)) return NotFound();

        var tasks = await db.Tasks
            .Where(t => t.BookingId == bookingId)
            .OrderBy(t => t.SortOrder)
            .ToListAsync();
        return Ok(tasks);
    }

    // POST api/bookings/{bookingId}/tasks
    [HttpPost]
    public async Task<IActionResult> Create(Guid bookingId, [FromBody] CreateTaskRequest req)
    {
        var pid = User.GetPhotographerId();
        if (!await BookingBelongsToPhotographer(bookingId, pid)) return NotFound();

        var maxOrder = await db.Tasks
            .Where(t => t.BookingId == bookingId)
            .MaxAsync(t => (int?)t.SortOrder) ?? -1;

        var task = new Task_
        {
            Id             = Guid.NewGuid(),
            BookingId      = bookingId,
            PhotographerId = pid,
            Title          = req.Title,
            Category       = req.Category,
            DueDate        = req.DueDate,
            IsAuto         = false,
            SortOrder      = maxOrder + 1,
            CreatedAt      = DateTime.UtcNow,
            UpdatedAt      = DateTime.UtcNow,
        };

        db.Tasks.Add(task);
        await db.SaveChangesAsync();
        return Ok(task);
    }

    // PATCH api/bookings/{bookingId}/tasks/{id}
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid bookingId, Guid id, [FromBody] UpdateTaskRequest req)
    {
        var pid = User.GetPhotographerId();
        var task = await db.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.BookingId == bookingId && t.PhotographerId == pid);
        if (task is null) return NotFound();

        if (req.Title     is not null) task.Title     = req.Title;
        if (req.Completed is not null)
        {
            task.Completed   = req.Completed.Value;
            task.CompletedAt = req.Completed.Value ? DateTime.UtcNow : null;
        }
        if (req.DueDate   is not null) task.DueDate   = req.DueDate;
        if (req.Category  is not null) task.Category  = req.Category.Value;

        task.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(task);
    }

    // DELETE api/bookings/{bookingId}/tasks/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid bookingId, Guid id)
    {
        var pid = User.GetPhotographerId();
        var task = await db.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.BookingId == bookingId && t.PhotographerId == pid);
        if (task is null) return NotFound();

        db.Tasks.Remove(task);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> BookingBelongsToPhotographer(Guid bookingId, Guid photographerId) =>
        await db.Bookings.AnyAsync(b => b.Id == bookingId && b.PhotographerId == photographerId);
}

public record CreateTaskRequest(
    string       Title,
    TaskCategory Category,
    DateOnly?    DueDate = null
);

public record UpdateTaskRequest(
    string?        Title     = null,
    bool?          Completed = null,
    DateOnly?      DueDate   = null,
    TaskCategory?  Category  = null
);