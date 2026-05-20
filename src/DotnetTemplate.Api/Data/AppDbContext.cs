using Microsoft.EntityFrameworkCore;

namespace DotnetTemplate.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<WorkspaceNoteEntity> WorkspaceNotes => Set<WorkspaceNoteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var note = modelBuilder.Entity<WorkspaceNoteEntity>();

        note.ToTable("workspace_notes");
        note.HasKey(entity => entity.Id);
        note.HasIndex(entity => entity.CreatedAtUtc);

        note.Property(entity => entity.Message)
            .HasMaxLength(280)
            .IsRequired();

        note.Property(entity => entity.CreatedBy)
            .HasMaxLength(120)
            .IsRequired();

        note.Property(entity => entity.Persona)
            .HasMaxLength(32)
            .IsRequired();
    }
}
