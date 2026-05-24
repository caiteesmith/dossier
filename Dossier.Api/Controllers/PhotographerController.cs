using Dossier.Api.Data;
using Dossier.Api.Extensions;
using Dossier.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dossier.Api.Controllers;

[ApiController, Route("api/photographer"), Authorize]
public class PhotographerController(DossierDbContext db) : ControllerBase
{
    // GET api/photographer/me
    // Returns the photographer record for the current JWT, creating it if first login
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var pid   = User.GetPhotographerId();
        var email = User.GetEmail();

        var photographer = await db.Photographers.FindAsync(pid);
        if (photographer is null)
        {
            // First login — auto-provision the photographer record
            photographer = new Photographer
            {
                Id        = pid,
                FullName  = email?.Split('@')[0] ?? "Photographer",
                Email     = email ?? "",
                Timezone  = "America/New_York",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            db.Photographers.Add(photographer);
            await db.SaveChangesAsync();
        }

        return Ok(photographer);
    }

    // PATCH api/photographer/me
    [HttpPatch("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdatePhotographerRequest req)
    {
        var pid          = User.GetPhotographerId();
        var photographer = await db.Photographers.FindAsync(pid);
        if (photographer is null) return NotFound();

        if (req.FullName        is not null) photographer.FullName        = req.FullName;
        if (req.BusinessName    is not null) photographer.BusinessName    = req.BusinessName;
        if (req.Phone           is not null) photographer.Phone           = req.Phone;
        if (req.Website         is not null) photographer.Website         = req.Website;
        if (req.Instagram       is not null) photographer.Instagram       = req.Instagram;
        if (req.CalendlyUrl     is not null) photographer.CalendlyUrl     = req.CalendlyUrl;
        if (req.Timezone        is not null) photographer.Timezone        = req.Timezone;
        if (req.BusinessAddress is not null) photographer.BusinessAddress = req.BusinessAddress;
        if (req.LogoUrl         is not null) photographer.LogoUrl         = req.LogoUrl;
        if (req.PortalSignoff   is not null) photographer.PortalSignoff   = req.PortalSignoff;

        photographer.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(photographer);
    }

    // GET api/photographer/packages
    [HttpGet("packages")]
    public async Task<IActionResult> GetPackages()
    {
        var pid = User.GetPhotographerId();
        var packages = await db.PackageTemplates
            .Where(p => p.PhotographerId == pid)
            .OrderBy(p => p.Price)
            .ToListAsync();
        return Ok(packages);
    }

    // POST api/photographer/packages
    [HttpPost("packages")]
    public async Task<IActionResult> CreatePackage([FromBody] CreatePackageRequest req)
    {
        var pid = User.GetPhotographerId();
        var pkg = new PackageTemplate
        {
            Id             = Guid.NewGuid(),
            PhotographerId = pid,
            Name           = req.Name,
            Description    = req.Description,
            Price          = req.Price,
            HoursCovered   = req.HoursCovered,
            Includes       = req.Includes ?? [],
            IsActive       = true,
            CreatedAt      = DateTime.UtcNow,
            UpdatedAt      = DateTime.UtcNow,
        };
        db.PackageTemplates.Add(pkg);
        await db.SaveChangesAsync();
        return Ok(pkg);
    }

    // PATCH api/photographer/packages/{id}
    [HttpPatch("packages/{id:guid}")]
    public async Task<IActionResult> UpdatePackage(Guid id, [FromBody] UpdatePackageRequest req)
    {
        var pid = User.GetPhotographerId();
        var pkg = await db.PackageTemplates
            .FirstOrDefaultAsync(p => p.Id == id && p.PhotographerId == pid);
        if (pkg is null) return NotFound();

        if (req.Name         is not null) pkg.Name         = req.Name;
        if (req.Description  is not null) pkg.Description  = req.Description;
        if (req.Price        is not null) pkg.Price        = req.Price.Value;
        if (req.HoursCovered is not null) pkg.HoursCovered = req.HoursCovered;
        if (req.Includes     is not null) pkg.Includes     = req.Includes;
        if (req.IsActive     is not null) pkg.IsActive     = req.IsActive.Value;

        pkg.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(pkg);
    }
}

public record UpdatePhotographerRequest(
    string? FullName        = null,
    string? BusinessName    = null,
    string? Phone           = null,
    string? Website         = null,
    string? Instagram       = null,
    string? CalendlyUrl     = null,
    string? Timezone        = null,
    string? BusinessAddress = null,
    string? LogoUrl         = null,
    string? PortalSignoff   = null
);

public record CreatePackageRequest(
    string    Name,
    decimal   Price,
    string?   Description  = null,
    decimal?  HoursCovered = null,
    string[]? Includes     = null
);

public record UpdatePackageRequest(
    string?   Name         = null,
    string?   Description  = null,
    decimal?  Price        = null,
    decimal?  HoursCovered = null,
    string[]? Includes     = null,
    bool?     IsActive     = null
);