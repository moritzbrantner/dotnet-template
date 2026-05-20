namespace DotnetTemplate.Api.Models;

public sealed record WorkspaceNoteDto(
    int Id,
    string Message,
    string CreatedBy,
    string Persona,
    DateTimeOffset CreatedAt
);

public sealed record CreateWorkspaceNoteRequest(
    string Message,
    string? CreatedBy,
    string? Persona
);

public sealed record UpdateWorkspaceNoteRequest(
    string Message,
    string? CreatedBy,
    string? Persona
);
