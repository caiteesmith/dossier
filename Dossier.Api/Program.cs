using Dossier.Api.Data;
using Dossier.Api.Extensions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

var builder = WebApplication.CreateBuilder(args);

// ── Database ────────────────────────────────────────────────────
builder.Services.AddDbContext<DossierDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// ── Supabase client ─────────────────────────────────────────────
var supabaseUrl = builder.Configuration["Supabase:Url"]
    ?? throw new InvalidOperationException("Supabase:Url is not configured.");
var supabaseKey = builder.Configuration["Supabase:ServiceRoleKey"]
    ?? throw new InvalidOperationException("Supabase:ServiceRoleKey is not configured.");

builder.Services.AddSingleton(_ => new Supabase.Client(supabaseUrl, supabaseKey));

// ── Auth: custom Supabase token validation ──────────────────────
builder.Services
    .AddAuthentication("Supabase")
    .AddScheme<AuthenticationSchemeOptions, SupabaseAuthHandler>("Supabase", _ => { });

builder.Services.AddAuthorization();

// ── CORS ────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

builder.Services.AddControllers()
    .AddJsonOptions(o => {
        o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter(
            System.Text.Json.JsonNamingPolicy.SnakeCaseLower
        ));
        o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

var app = builder.Build();

app.UseCors();

app.Use(async (context, next) =>
{
    if (context.Request.Method == "OPTIONS")
    {
        context.Response.StatusCode = 200;
        await context.Response.CompleteAsync();
        return;
    }
    await next();
});

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// ── Supabase auth handler ───────────────────────────────────────
public class SupabaseAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    Supabase.Client supabase)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var authHeader = Request.Headers.Authorization.FirstOrDefault();
        if (authHeader is null || !authHeader.StartsWith("Bearer "))
            return AuthenticateResult.Fail("No token");

        var token = authHeader["Bearer ".Length..];

        try
        {
            var response = await supabase.Auth.GetUser(token);
            if (response?.Id is null)
                return AuthenticateResult.Fail("Invalid token");

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, response.Id),
                new Claim("sub", response.Id),
            };

            var identity = new ClaimsIdentity(claims, Scheme.Name);
            var principal = new ClaimsPrincipal(identity);
            return AuthenticateResult.Success(new AuthenticationTicket(principal, Scheme.Name));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Auth error: {ex.Message}");
            return AuthenticateResult.Fail("Token validation failed");
        }
    }
}