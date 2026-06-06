using Dossier.Api.Data;
using Dossier.Api.Extensions;
using Dossier.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dossier.Api.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class LeadsController(DossierDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var pid = User.GetPhotographerId();
        var leads = await db.Leads
            .Where(l => l.PhotographerId == pid)
            .OrderByDescending(l => l.InquiryDate)
            .ToListAsync();
        return Ok(leads);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLeadRequest req)
    {
        var pid = User.GetPhotographerId();
        var lead = new Lead
        {
            Id             = Guid.NewGuid(),
            PhotographerId = pid,
            FirstName      = req.FirstName,
            LastName       = req.LastName,
            PartnerName    = req.PartnerName,
            Email          = req.Email,
            Phone          = req.Phone,
            WeddingDate    = req.WeddingDate,
            VenueName      = req.VenueName,
            Status         = LeadStatus.New,
            InquiryDate    = DateOnly.FromDateTime(DateTime.UtcNow),
            CreatedAt      = DateTime.UtcNow,
            UpdatedAt      = DateTime.UtcNow,
        };
        db.Leads.Add(lead);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = lead.Id }, lead);
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLeadRequest req)
    {
        var pid = User.GetPhotographerId();
        var lead = await db.Leads
            .FirstOrDefaultAsync(l => l.Id == id && l.PhotographerId == pid);
        if (lead is null) return NotFound();

        if (req.Status      is not null) lead.Status      = req.Status.Value;
        if (req.FirstName   is not null) lead.FirstName   = req.FirstName;
        if (req.LastName    is not null) lead.LastName     = req.LastName;
        if (req.PartnerName is not null) lead.PartnerName  = req.PartnerName;
        if (req.Email       is not null) lead.Email        = req.Email;
        if (req.Phone       is not null) lead.Phone        = req.Phone;
        if (req.VenueName   is not null) lead.VenueName    = req.VenueName;
        if (req.WeddingDate is not null) lead.WeddingDate  = req.WeddingDate;
        if (req.Notes       is not null) lead.Notes        = req.Notes;

        lead.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(lead);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var pid = User.GetPhotographerId();
        var lead = await db.Leads
            .FirstOrDefaultAsync(l => l.Id == id && l.PhotographerId == pid);
        if (lead is null) return NotFound();
        db.Leads.Remove(lead);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record CreateLeadRequest(
    string    FirstName,
    string    LastName,
    string    Email,
    string?   PartnerName  = null,
    string?   Phone        = null,
    DateOnly? WeddingDate  = null,
    string?   VenueName    = null
);

public record UpdateLeadRequest(
    LeadStatus? Status       = null,
    string?     FirstName    = null,
    string?     LastName     = null,
    string?     PartnerName  = null,
    string?     Email        = null,
    string?     Phone        = null,
    string?     VenueName    = null,
    DateOnly?   WeddingDate  = null,
    string?     Notes        = null
);