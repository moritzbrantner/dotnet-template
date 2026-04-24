namespace DotnetTemplate.Api.Models;

public sealed record DevState(
    string Persona,
    AuthSession Session,
    IReadOnlyList<NavigationCategory> Navigation,
    IReadOnlyList<SettingsSection> SettingsSections,
    NotificationSummary? Notifications,
    IReadOnlyList<MetricCard> Metrics,
    IReadOnlyList<ActivityItem> Activity,
    IReadOnlyList<ProfileFollower> Followers,
    IReadOnlyList<TeamMember> TeamMembers,
    AdminState? Admin
);

public sealed record AuthSession(
    string Status,
    UserProfile? User,
    string? Error
);

public sealed record UserProfile(
    string Id,
    string Username,
    string DisplayName,
    string Email,
    string Title,
    string Bio,
    string Locale,
    string Timezone,
    string[] Roles,
    string[] Permissions
);

public sealed record NavigationCategory(
    string Key,
    string Label,
    IReadOnlyList<NavigationItem> Items
);

public sealed record NavigationItem(
    string Key,
    string Href,
    string Label,
    string Description
);

public sealed record SettingsSection(
    string Key,
    string Title,
    string Description,
    IReadOnlyList<SettingsField> Fields
);

public sealed record SettingsField(
    string Key,
    string Label,
    string Type,
    string? Value,
    bool Enabled
);

public sealed record NotificationSummary(int UnreadCount);

public sealed record MetricCard(
    string Key,
    string Label,
    string Value,
    string Detail
);

public sealed record ActivityItem(
    string Id,
    string Title,
    string Detail,
    string Timestamp
);

public sealed record ProfileFollower(
    string Id,
    string DisplayName,
    string Username,
    string Title,
    string Relationship,
    string Visibility,
    string FollowedAt
);

public sealed record TeamMember(
    string Id,
    string DisplayName,
    string Role,
    string Focus,
    string Availability,
    string Timezone
);

public sealed record AdminState(
    IReadOnlyList<MetricCard> Metrics,
    IReadOnlyList<AdminUser> Users,
    IReadOnlyList<AuditEvent> AuditEvents,
    AdminWorkspaceSettings Settings
);

public sealed record AdminUser(
    string Id,
    string DisplayName,
    string Email,
    string[] Roles,
    string Status,
    string CreatedAt,
    string? LastActiveAt
);

public sealed record AuditEvent(
    string Id,
    string Action,
    string ActorName,
    string Target,
    string Severity,
    string Description,
    string CreatedAt
);

public sealed record AdminWorkspaceSettings(
    bool InviteOnly,
    string DefaultRole,
    string AuditLogRetention,
    bool RequireMfa
);
