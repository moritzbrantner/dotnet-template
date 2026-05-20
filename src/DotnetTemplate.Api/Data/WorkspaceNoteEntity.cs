namespace DotnetTemplate.Api.Data;

public sealed class WorkspaceNoteEntity
{
    public int Id { get; set; }
    public string Message { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public string Persona { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}
