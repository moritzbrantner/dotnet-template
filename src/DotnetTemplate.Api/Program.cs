using DotnetTemplate.Api.Data;
using DotnetTemplate.Api.Models;
using DotnetTemplate.Api.Services;
using Microsoft.EntityFrameworkCore;
using System.Data.Common;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Postgres")
    ?? throw new InvalidOperationException("Connection string 'Postgres' is missing.");

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyHeader()
            .AllowAnyMethod()
            .AllowAnyOrigin();
    });
});
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure();
    });
});
builder.Services.AddSingleton<StarterDemoService>();

var app = builder.Build();

await InitializeDatabaseAsync(app.Services, app.Configuration, app.Logger);

app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

var api = app.MapGroup("/api");

api.MapGet("/health", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var databaseConnected = await TryCanConnectAsync(dbContext, cancellationToken);
    var noteCount = 0;

    if (databaseConnected)
    {
        try
        {
            noteCount = await dbContext.WorkspaceNotes.CountAsync(cancellationToken);
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested)
        {
            databaseConnected = false;
        }
    }

    return Results.Ok(new
    {
        ok = true,
        service = "dotnet-template api",
        timestamp = DateTimeOffset.UtcNow,
        database = new
        {
            connected = databaseConnected,
            noteCount
        }
    });
});

api.MapGet("/personas", () => Results.Ok(StarterDemoService.AllPersonas));

api.MapGet("/dev-state", (string? persona, StarterDemoService demoService) =>
{
    return Results.Ok(demoService.CreateState(persona));
});

api.MapGet("/session", (string? persona, StarterDemoService demoService) =>
{
    return Results.Ok(demoService.CreateState(persona).Session);
});

api.MapGet("/navigation", (string? persona, StarterDemoService demoService) =>
{
    return Results.Ok(demoService.CreateState(persona).Navigation);
});

api.MapGet("/settings", (string? persona, StarterDemoService demoService) =>
{
    return Results.Ok(demoService.CreateState(persona).SettingsSections);
});

api.MapGet("/followers", (string? persona, StarterDemoService demoService) =>
{
    return Results.Ok(demoService.CreateState(persona).Followers);
});

api.MapGet("/notes", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    try
    {
        var notes = await dbContext.WorkspaceNotes
            .OrderByDescending(note => note.CreatedAtUtc)
            .Take(25)
            .Select(note => new WorkspaceNoteDto(
                note.Id,
                note.Message,
                note.CreatedBy,
                note.Persona,
                DateTime.SpecifyKind(note.CreatedAtUtc, DateTimeKind.Utc)))
            .ToListAsync(cancellationToken);

        return Results.Ok(notes);
    }
    catch (Exception ex) when (!cancellationToken.IsCancellationRequested && IsDatabaseFailure(ex))
    {
        return DatabaseUnavailable(ex);
    }
});

api.MapGet("/notes/{id:int}", async (int id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    try
    {
        var note = await dbContext.WorkspaceNotes.FindAsync([id], cancellationToken);

        return note is null
            ? Results.NotFound()
            : Results.Ok(ToDto(note));
    }
    catch (Exception ex) when (!cancellationToken.IsCancellationRequested && IsDatabaseFailure(ex))
    {
        return DatabaseUnavailable(ex);
    }
});

api.MapPost("/notes", async (CreateWorkspaceNoteRequest? request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var validationResult = ValidateCreateNoteRequest(request);

    if (validationResult.Errors.Count > 0)
    {
        return Results.ValidationProblem(validationResult.Errors);
    }

    var note = new WorkspaceNoteEntity
    {
        Message = validationResult.Message,
        CreatedBy = validationResult.CreatedBy,
        Persona = validationResult.Persona,
        CreatedAtUtc = DateTime.UtcNow
    };

    try
    {
        dbContext.WorkspaceNotes.Add(note);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/notes/{note.Id}", ToDto(note));
    }
    catch (Exception ex) when (!cancellationToken.IsCancellationRequested && IsDatabaseFailure(ex))
    {
        return DatabaseUnavailable(ex);
    }
});

api.MapPut("/notes/{id:int}", async (int id, UpdateWorkspaceNoteRequest? request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var validationResult = ValidateUpdateNoteRequest(request);

    if (validationResult.Errors.Count > 0)
    {
        return Results.ValidationProblem(validationResult.Errors);
    }

    try
    {
        var note = await dbContext.WorkspaceNotes.FindAsync([id], cancellationToken);

        if (note is null)
        {
            return Results.NotFound();
        }

        note.Message = validationResult.Message;
        note.CreatedBy = validationResult.CreatedBy;
        note.Persona = validationResult.Persona;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(ToDto(note));
    }
    catch (Exception ex) when (!cancellationToken.IsCancellationRequested && IsDatabaseFailure(ex))
    {
        return DatabaseUnavailable(ex);
    }
});

api.MapDelete("/notes/{id:int}", async (int id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    try
    {
        var note = await dbContext.WorkspaceNotes.FindAsync([id], cancellationToken);

        if (note is null)
        {
            return Results.NotFound();
        }

        dbContext.WorkspaceNotes.Remove(note);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
    catch (Exception ex) when (!cancellationToken.IsCancellationRequested && IsDatabaseFailure(ex))
    {
        return DatabaseUnavailable(ex);
    }
});

app.MapFallbackToFile("index.html");

app.Run();

static WorkspaceNoteDto ToDto(WorkspaceNoteEntity note)
{
    return new WorkspaceNoteDto(
        note.Id,
        note.Message,
        note.CreatedBy,
        note.Persona,
        DateTime.SpecifyKind(note.CreatedAtUtc, DateTimeKind.Utc));
}

static async Task InitializeDatabaseAsync(IServiceProvider services, IConfiguration configuration, ILogger logger)
{
    var maxAttempts = configuration.GetValue("DatabaseInitialization:MaxAttempts", 6);
    var retryDelay = TimeSpan.FromMilliseconds(configuration.GetValue("DatabaseInitialization:RetryDelayMilliseconds", 2000));

    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            await using var scope = services.CreateAsyncScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await dbContext.Database.MigrateAsync();
            return;
        }
        catch (Exception ex) when (attempt < maxAttempts)
        {
            logger.LogWarning(ex, "Database initialization attempt {Attempt} failed. Retrying.", attempt);
            await Task.Delay(retryDelay);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Database migration failed after {MaxAttempts} attempt(s). Continuing startup without database availability.", maxAttempts);
            return;
        }
    }
}

static async Task<bool> TryCanConnectAsync(AppDbContext dbContext, CancellationToken cancellationToken)
{
    try
    {
        return await dbContext.Database.CanConnectAsync(cancellationToken);
    }
    catch (Exception) when (!cancellationToken.IsCancellationRequested)
    {
        return false;
    }
}

static NoteValidationResult ValidateCreateNoteRequest(CreateWorkspaceNoteRequest? request)
{
    if (request is null)
    {
        return new NoteValidationResult(new Dictionary<string, string[]>
        {
            ["body"] = ["Request body is required."]
        });
    }

    return ValidateNoteValues(request.Message, request.CreatedBy, request.Persona);
}

static NoteValidationResult ValidateUpdateNoteRequest(UpdateWorkspaceNoteRequest? request)
{
    if (request is null)
    {
        return new NoteValidationResult(new Dictionary<string, string[]>
        {
            ["body"] = ["Request body is required."]
        });
    }

    return ValidateNoteValues(request.Message, request.CreatedBy, request.Persona);
}

static NoteValidationResult ValidateNoteValues(string? rawMessage, string? rawCreatedBy, string? rawPersona)
{
    var errors = new Dictionary<string, string[]>();
    var message = rawMessage?.Trim() ?? string.Empty;
    var createdBy = string.IsNullOrWhiteSpace(rawCreatedBy) ? "Local developer" : rawCreatedBy.Trim();
    var persona = string.IsNullOrWhiteSpace(rawPersona) ? "unknown" : rawPersona.Trim().ToLowerInvariant();

    if (string.IsNullOrWhiteSpace(message))
    {
        errors["message"] = ["Message is required."];
    }
    else if (message.Length > 280)
    {
        errors["message"] = ["Message must be 280 characters or fewer."];
    }

    if (createdBy.Length > 120)
    {
        errors["createdBy"] = ["Created by must be 120 characters or fewer."];
    }

    if (persona.Length > 32)
    {
        errors["persona"] = ["Persona must be 32 characters or fewer."];
    }
    else if (!string.IsNullOrWhiteSpace(rawPersona) && !StarterDemoService.AllPersonas.Contains(persona, StringComparer.OrdinalIgnoreCase))
    {
        errors["persona"] = [$"Persona must be one of: {string.Join(", ", StarterDemoService.AllPersonas)}."];
    }

    return errors.Count > 0
        ? new NoteValidationResult(errors)
        : new NoteValidationResult(message, createdBy, persona);
}

static bool IsDatabaseFailure(Exception exception)
{
    for (var current = exception; current is not null; current = current.InnerException)
    {
        if (current is DbException or TimeoutException or InvalidOperationException)
        {
            return true;
        }
    }

    return false;
}

static IResult DatabaseUnavailable(Exception exception)
{
    return Results.Problem(
        title: "Database unavailable",
        detail: exception.Message,
        statusCode: StatusCodes.Status503ServiceUnavailable);
}

internal sealed record NoteValidationResult
{
    public NoteValidationResult(IReadOnlyDictionary<string, string[]> errors)
    {
        Message = string.Empty;
        CreatedBy = string.Empty;
        Persona = string.Empty;
        Errors = errors;
    }

    public NoteValidationResult(string message, string createdBy, string persona)
    {
        Message = message;
        CreatedBy = createdBy;
        Persona = persona;
        Errors = new Dictionary<string, string[]>();
    }

    public string Message { get; }
    public string CreatedBy { get; }
    public string Persona { get; }
    public IReadOnlyDictionary<string, string[]> Errors { get; }
}

public partial class Program;
