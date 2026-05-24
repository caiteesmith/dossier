using System.Security.Claims;

namespace Dossier.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    // Supabase JWTs use the "sub" claim as the user's UUID
    public static Guid GetPhotographerId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? user.FindFirstValue("sub")
               ?? throw new InvalidOperationException("No sub claim in JWT.");
        return Guid.Parse(sub);
    }

    public static string? GetEmail(this ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.Email)
     ?? user.FindFirstValue("email");
}