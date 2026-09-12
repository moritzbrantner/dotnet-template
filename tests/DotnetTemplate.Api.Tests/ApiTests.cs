using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using DotnetTemplate.Api.Data;
using DotnetTemplate.Api.Models;
using Xunit;

namespace DotnetTemplate.Api.Tests;

public sealed class ApiTests(PostgresFixture postgres) : IClassFixture<PostgresFixture>, IAsyncLifetime, IDisposable
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly ApiFactory _factory = new(postgres.ConnectionString);

    public async Task InitializeAsync()
    {
        _ = _factory.CreateClient();
        await _factory.ResetNotesAsync();
    }

    public Task DisposeAsync()
    {
        Dispose();
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _factory.Dispose();
        GC.SuppressFinalize(this);
    }

    [Fact]
    public async Task HealthReturnsOkAndConnectedDatabaseWhenPostgresIsAvailable()
    {
        var document = await GetJsonDocumentAsync("/api/health");

        Assert.True(document.RootElement.GetProperty("ok").GetBoolean());
        Assert.True(document.RootElement.GetProperty("database").GetProperty("connected").GetBoolean());
    }

    [Fact]
    public async Task DevStateAdminIncludesAdminState()
    {
        var document = await GetJsonDocumentAsync("/api/dev-state?persona=admin");

        Assert.Equal("admin", document.RootElement.GetProperty("persona").GetString());
        Assert.NotEqual(JsonValueKind.Null, document.RootElement.GetProperty("admin").ValueKind);
    }

    [Fact]
    public async Task DevStateAnonymousHidesPrivateAuthenticatedData()
    {
        var document = await GetJsonDocumentAsync("/api/dev-state?persona=anonymous");

        Assert.Equal("anonymous", document.RootElement.GetProperty("session").GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, document.RootElement.GetProperty("session").GetProperty("user").ValueKind);
        Assert.Empty(document.RootElement.GetProperty("settingsSections").EnumerateArray());
        Assert.Empty(document.RootElement.GetProperty("followers").EnumerateArray());
    }

    [Fact]
    public async Task CreateNoteReturnsCreatedNote()
    {
        var response = await Client.PostAsJsonAsync("/api/notes", new CreateWorkspaceNoteRequest(" hello ", null, "ADMIN"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal("/api/notes/1", response.Headers.Location?.OriginalString);

        var note = await response.Content.ReadFromJsonAsync<WorkspaceNoteDto>(JsonOptions);
        Assert.NotNull(note);
        Assert.Equal("hello", note.Message);
        Assert.Equal("Local developer", note.CreatedBy);
        Assert.Equal("admin", note.Persona);
    }

    [Fact]
    public async Task CreateNoteAcceptsExactMessageAndCreatedByLengthLimits()
    {
        var message = new string('m', 280);
        var createdBy = new string('c', 120);

        var response = await Client.PostAsJsonAsync(
            "/api/notes",
            new CreateWorkspaceNoteRequest(message, createdBy, "admin"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var note = await response.Content.ReadFromJsonAsync<WorkspaceNoteDto>(JsonOptions);
        Assert.NotNull(note);
        Assert.Equal(message, note.Message);
        Assert.Equal(createdBy, note.CreatedBy);
        Assert.Equal("admin", note.Persona);
    }

    [Fact]
    public async Task CreateNoteDefaultsBlankOptionalFields()
    {
        var response = await Client.PostAsJsonAsync(
            "/api/notes",
            new CreateWorkspaceNoteRequest("hello", "   ", null));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var note = await response.Content.ReadFromJsonAsync<WorkspaceNoteDto>(JsonOptions);
        Assert.NotNull(note);
        Assert.Equal("Local developer", note.CreatedBy);
        Assert.Equal("unknown", note.Persona);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateNoteRejectsMissingMessage(string? message)
    {
        var response = await Client.PostAsJsonAsync("/api/notes", new CreateWorkspaceNoteRequest(message!, "Tester", "user"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await AssertValidationErrorAsync(response, "message");
    }

    [Fact]
    public async Task CreateNoteRejectsNullBody()
    {
        using var content = new StringContent("null", Encoding.UTF8, "application/json");

        var response = await Client.PostAsync("/api/notes", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await AssertValidationErrorAsync(response, "body");
    }

    [Fact]
    public async Task CreateNoteRejectsOverlongMessage()
    {
        var response = await Client.PostAsJsonAsync("/api/notes", new CreateWorkspaceNoteRequest(new string('a', 281), "Tester", "user"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await AssertValidationErrorAsync(response, "message");
    }

    [Fact]
    public async Task CreateNoteRejectsInvalidPersona()
    {
        var response = await Client.PostAsJsonAsync("/api/notes", new CreateWorkspaceNoteRequest("hello", "Tester", "manager"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await AssertValidationErrorAsync(response, "persona");
    }

    [Fact]
    public async Task ListNotesReturnsNewestFirstAndLimitsToTwentyFive()
    {
        var notes = Enumerable.Range(1, 30).Select(index => new WorkspaceNoteEntity
        {
            Message = $"note-{index}",
            CreatedBy = "Tester",
            Persona = "user",
            CreatedAtUtc = new DateTime(2026, 5, 1, 8, 0, 0, DateTimeKind.Utc).AddMinutes(index)
        });
        await _factory.SeedNotesAsync(notes);

        var response = await Client.GetFromJsonAsync<WorkspaceNoteDto[]>("/api/notes", JsonOptions);

        Assert.NotNull(response);
        Assert.Equal(25, response.Length);
        Assert.Equal("note-30", response[0].Message);
        Assert.Equal("note-6", response[^1].Message);
    }

    [Fact]
    public async Task GetNoteReturnsNotFoundWhenMissing()
    {
        var response = await Client.GetAsync("/api/notes/404");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateNoteUpdatesFieldsAndValidatesPayload()
    {
        var created = await CreateNoteAsync("before", "Alice", "user");

        var updateResponse = await Client.PutAsJsonAsync($"/api/notes/{created.Id}", new UpdateWorkspaceNoteRequest(" after ", " Bob ", "MEMBER"));
        var updated = await updateResponse.Content.ReadFromJsonAsync<WorkspaceNoteDto>(JsonOptions);

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        Assert.NotNull(updated);
        Assert.Equal(created.Id, updated.Id);
        Assert.Equal("after", updated.Message);
        Assert.Equal("Bob", updated.CreatedBy);
        Assert.Equal("member", updated.Persona);

        var invalidResponse = await Client.PutAsJsonAsync($"/api/notes/{created.Id}", new UpdateWorkspaceNoteRequest(" ", "Bob", "member"));

        Assert.Equal(HttpStatusCode.BadRequest, invalidResponse.StatusCode);
        await AssertValidationErrorAsync(invalidResponse, "message");
    }

    [Fact]
    public async Task UpdateNoteReturnsNotFoundWhenMissing()
    {
        var response = await Client.PutAsJsonAsync("/api/notes/404", new UpdateWorkspaceNoteRequest("after", "Bob", "member"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteNoteRemovesNote()
    {
        var created = await CreateNoteAsync("delete me", "Alice", "user");

        var deleteResponse = await Client.DeleteAsync($"/api/notes/{created.Id}");
        var getResponse = await Client.GetAsync($"/api/notes/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task DeleteNoteReturnsNotFoundWhenMissing()
    {
        var response = await Client.DeleteAsync("/api/notes/404");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task HealthReturnsOkAndDisconnectedDatabaseWhenPostgresIsUnavailable()
    {
        using var factory = new ApiFactory("Host=localhost;Port=1;Database=missing;Username=postgres;Password=postgres;Timeout=1;Command Timeout=1");
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/health");
        var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(document.RootElement.GetProperty("database").GetProperty("connected").GetBoolean());
    }

    private HttpClient Client => _factory.CreateClient();

    private async Task<JsonDocument> GetJsonDocumentAsync(string requestUri)
    {
        var response = await Client.GetAsync(requestUri);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
    }

    private async Task<WorkspaceNoteDto> CreateNoteAsync(string message, string createdBy, string persona)
    {
        var response = await Client.PostAsJsonAsync("/api/notes", new CreateWorkspaceNoteRequest(message, createdBy, persona));

        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<WorkspaceNoteDto>(JsonOptions))!;
    }

    private static async Task AssertValidationErrorAsync(HttpResponseMessage response, string key)
    {
        var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        var errors = document.RootElement.GetProperty("errors");

        Assert.True(errors.TryGetProperty(key, out _), $"Expected validation error for '{key}'.");
    }
}
