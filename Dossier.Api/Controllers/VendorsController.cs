using Dossier.Api.Data;
using Dossier.Api.Extensions;
using Dossier.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dossier.Api.Controllers;

[ApiController, Route("api/bookings/{bookingId:guid}/vendors"), Authorize]
public class VendorsController(DossierDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid bookingId)
    {
        var pid = User.GetPhotographerId();
        if (!await BookingOwnedBy(bookingId, pid)) return NotFound();
        return Ok(await db.Vendors.Where(v => v.BookingId == bookingId).OrderBy(v => v.SortOrder).ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid bookingId, [FromBody] CreateVendorRequest req)
    {
        var pid = User.GetPhotographerId();
        if (!await BookingOwnedBy(bookingId, pid)) return NotFound();

        var maxOrder = await db.Vendors.Where(v => v.BookingId == bookingId).MaxAsync(v => (int?)v.SortOrder) ?? -1;
        var vendor = new Vendor
        {
            Id        = Guid.NewGuid(),
            BookingId = bookingId,
            Role      = req.Role,
            Name      = req.Name,
            Phone     = req.Phone,
            Email     = req.Email,
            Notes     = req.Notes,
            SortOrder = maxOrder + 1,
            CreatedAt = DateTime.UtcNow,
        };
        db.Vendors.Add(vendor);
        await db.SaveChangesAsync();
        return Ok(vendor);
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid bookingId, Guid id, [FromBody] UpdateVendorRequest req)
    {
        var pid = User.GetPhotographerId();
        if (!await BookingOwnedBy(bookingId, pid)) return NotFound();
        var vendor = await db.Vendors.FirstOrDefaultAsync(v => v.Id == id && v.BookingId == bookingId);
        if (vendor is null) return NotFound();

        if (req.Role  is not null) vendor.Role  = req.Role;
        if (req.Name  is not null) vendor.Name  = req.Name;
        if (req.Phone is not null) vendor.Phone = req.Phone;
        if (req.Email is not null) vendor.Email = req.Email;
        if (req.Notes is not null) vendor.Notes = req.Notes;
        await db.SaveChangesAsync();
        return Ok(vendor);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid bookingId, Guid id)
    {
        var pid = User.GetPhotographerId();
        if (!await BookingOwnedBy(bookingId, pid)) return NotFound();
        var vendor = await db.Vendors.FirstOrDefaultAsync(v => v.Id == id && v.BookingId == bookingId);
        if (vendor is null) return NotFound();
        db.Vendors.Remove(vendor);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> BookingOwnedBy(Guid bookingId, Guid pid) =>
        await db.Bookings.AnyAsync(b => b.Id == bookingId && b.PhotographerId == pid);
}

public record CreateVendorRequest(string Role, string Name, string? Phone, string? Email, string? Notes);
public record UpdateVendorRequest(string? Role, string? Name, string? Phone, string? Email, string? Notes);