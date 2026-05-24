using Dossier.Api.Data;
using Dossier.Api.Extensions;
using Dossier.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dossier.Api.Controllers;

[ApiController, Route("api/bookings/{bookingId:guid}/shot-list"), Authorize]
public class ShotListController(DossierDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(Guid bookingId)
    {
        var pid = User.GetPhotographerId();
        if (!await BookingOwnedBy(bookingId, pid)) return NotFound();

        var shotList = await db.ShotLists
            .Include(s => s.Groups.OrderBy(g => g.SortOrder))
            .ThenInclude(g => g.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(s => s.BookingId == bookingId);

        return shotList is null ? NotFound() : Ok(shotList);
    }

    // POST api/bookings/{bookingId}/shot-list/groups
    [HttpPost("groups")]
    public async Task<IActionResult> AddGroup(Guid bookingId, [FromBody] CreateGroupRequest req)
    {
        var pid = User.GetPhotographerId();
        if (!await BookingOwnedBy(bookingId, pid)) return NotFound();

        var shotList = await db.ShotLists.FirstOrDefaultAsync(s => s.BookingId == bookingId);
        if (shotList is null)
        {
            shotList = new ShotList { Id = Guid.NewGuid(), BookingId = bookingId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            db.ShotLists.Add(shotList);
            await db.SaveChangesAsync();
        }

        var maxOrder = await db.ShotListGroups.Where(g => g.ShotListId == shotList.Id).MaxAsync(g => (int?)g.SortOrder) ?? -1;
        var group = new ShotListGroup
        {
            Id         = Guid.NewGuid(),
            ShotListId = shotList.Id,
            Name       = req.Name,
            SortOrder  = maxOrder + 1,
            CreatedAt  = DateTime.UtcNow,
        };
        db.ShotListGroups.Add(group);

        // Add items inline if provided
        if (req.Items?.Count > 0)
        {
            var items = req.Items.Select((desc, i) => new ShotListItem
            {
                Id          = Guid.NewGuid(),
                GroupId     = group.Id,
                Description = desc,
                SortOrder   = i,
                CreatedAt   = DateTime.UtcNow,
            });
            db.ShotListItems.AddRange(items);
        }

        await db.SaveChangesAsync();
        return Ok(group);
    }

    // POST api/bookings/{bookingId}/shot-list/groups/{groupId}/items
    [HttpPost("groups/{groupId:guid}/items")]
    public async Task<IActionResult> AddItem(Guid bookingId, Guid groupId, [FromBody] CreateItemRequest req)
    {
        var pid = User.GetPhotographerId();
        if (!await BookingOwnedBy(bookingId, pid)) return NotFound();

        var maxOrder = await db.ShotListItems.Where(i => i.GroupId == groupId).MaxAsync(i => (int?)i.SortOrder) ?? -1;
        var item = new ShotListItem
        {
            Id          = Guid.NewGuid(),
            GroupId     = groupId,
            Description = req.Description,
            Notes       = req.Notes,
            SortOrder   = maxOrder + 1,
            CreatedAt   = DateTime.UtcNow,
        };
        db.ShotListItems.Add(item);
        await db.SaveChangesAsync();
        return Ok(item);
    }

    // PATCH api/bookings/{bookingId}/shot-list/items/{itemId}
    [HttpPatch("items/{itemId:guid}")]
    public async Task<IActionResult> UpdateItem(Guid bookingId, Guid itemId, [FromBody] UpdateItemRequest req)
    {
        var pid = User.GetPhotographerId();
        if (!await BookingOwnedBy(bookingId, pid)) return NotFound();

        var item = await db.ShotListItems.FindAsync(itemId);
        if (item is null) return NotFound();

        if (req.Description is not null) item.Description = req.Description;
        if (req.Notes       is not null) item.Notes       = req.Notes;
        if (req.Completed   is not null) item.Completed   = req.Completed.Value;
        if (req.GroupId     is not null) item.GroupId     = req.GroupId.Value;
        if (req.SortOrder   is not null) item.SortOrder   = req.SortOrder.Value;

        await db.SaveChangesAsync();
        return Ok(item);
    }

    private async Task<bool> BookingOwnedBy(Guid bookingId, Guid pid) =>
        await db.Bookings.AnyAsync(b => b.Id == bookingId && b.PhotographerId == pid);
}

public record CreateGroupRequest(string Name, List<string>? Items = null);
public record CreateItemRequest(string Description, string? Notes = null);
public record UpdateItemRequest(string? Description = null, string? Notes = null, bool? Completed = null, Guid? GroupId = null, int? SortOrder = null);