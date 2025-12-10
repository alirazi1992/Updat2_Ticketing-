using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Ticketing.Backend.Application.Services;
using Ticketing.Backend.Domain.Entities;
using Ticketing.Backend.Infrastructure.Auth;
using Ticketing.Backend.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// =======================
// JWT configuration
// =======================
var jwtSettings = new JwtSettings();
builder.Configuration.GetSection("Jwt").Bind(jwtSettings);

// Fallback secret for local development
if (string.IsNullOrWhiteSpace(jwtSettings.Secret))
{
    jwtSettings.Secret =
        builder.Configuration["JWT_SECRET"] ?? "SuperSecretDevelopmentKey!ChangeMe";
}

builder.Services.AddSingleton(jwtSettings);

// =======================
// DbContext (SQLite)
// =======================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=ticketing.db"));

// =======================
// Application services
// =======================
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ITicketService, TicketService>();

// =======================
// Authentication / JWT
// =======================
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings.Secret))
    };
});

builder.Services.AddAuthorization();

// =======================
// CORS
// =======================
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy
            .WithOrigins("http://localhost:3000", "https://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());

    // Optional: open policy for tools like Swagger / other clients
    options.AddPolicy("AllOrigins", policy =>
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod());
});

// =======================
// MVC / Swagger
// =======================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Always serialize enums as strings to match the frontend expectations
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        // Emit camelCase properties so the frontend API types align with the backend payloads
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Reflect enum string values in Swagger schemas
    options.MapType<Ticketing.Backend.Domain.Enums.TicketStatus>(() =>
        new Microsoft.OpenApi.Models.OpenApiSchema
        {
            Type = "string",
            Enum = Enum.GetNames(typeof(Ticketing.Backend.Domain.Enums.TicketStatus))
                .Select(name => (Microsoft.OpenApi.Any.IOpenApiAny)new Microsoft.OpenApi.Any.OpenApiString(name))
                .ToList()
        });

    options.MapType<Ticketing.Backend.Domain.Enums.TicketPriority>(() =>
        new Microsoft.OpenApi.Models.OpenApiSchema
        {
            Type = "string",
            Enum = Enum.GetNames(typeof(Ticketing.Backend.Domain.Enums.TicketPriority))
                .Select(name => (Microsoft.OpenApi.Any.IOpenApiAny)new Microsoft.OpenApi.Any.OpenApiString(name))
                .ToList()
        });

    options.MapType<Ticketing.Backend.Domain.Enums.UserRole>(() =>
        new Microsoft.OpenApi.Models.OpenApiSchema
        {
            Type = "string",
            Enum = Enum.GetNames(typeof(Ticketing.Backend.Domain.Enums.UserRole))
                .Select(name => (Microsoft.OpenApi.Any.IOpenApiAny)new Microsoft.OpenApi.Any.OpenApiString(name))
                .ToList()
        });
});

var app = builder.Build();

// =======================
// Apply migrations & seed
// =======================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    var passwordHasher = services.GetRequiredService<IPasswordHasher<User>>();

    await context.Database.MigrateAsync();
    await SeedData.InitializeAsync(context, passwordHasher);
}

// =======================
// Middleware pipeline
// =======================

app.UseCors("Frontend");

app.UseSwagger();
app.UseSwaggerUI();

//app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/ping", () => Results.Ok(new { message = "pong" }));

app.MapControllers();

app.Run();
