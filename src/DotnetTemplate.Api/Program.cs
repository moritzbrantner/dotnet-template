using DotnetTemplate.Api.Services;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddSingleton<StarterDemoService>();

var app = builder.Build();

app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

var api = app.MapGroup("/api");

api.MapGet("/health", () => Results.Ok(new
{
    ok = true,
    service = "dotnet-template api",
    timestamp = DateTimeOffset.UtcNow
}));

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

app.Run();
