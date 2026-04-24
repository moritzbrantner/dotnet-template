using DotnetTemplate.Api.Models;

namespace DotnetTemplate.Api.Services;

public sealed class StarterDemoService
{
    public static readonly string[] AllPersonas = ["user", "member", "admin", "anonymous", "error"];

    public DevState CreateState(string? requestedPersona)
    {
        var persona = NormalizePersona(requestedPersona);
        var session = CreateSession(persona);

        return new DevState(
            Persona: persona,
            Session: session,
            Navigation: CreateNavigation(session),
            SettingsSections: CreateSettingsSections(session),
            Notifications: session.Status == "authenticated"
                ? new NotificationSummary(session.User!.Roles.Contains("admin") ? 7 : 3)
                : null,
            Metrics: CreateMetrics(persona),
            Activity: CreateActivity(persona),
            Followers: CreateFollowers(persona, session),
            TeamMembers: CreateTeamMembers(session),
            Admin: IsAdmin(session) ? CreateAdminState() : null
        );
    }

    private static string NormalizePersona(string? requestedPersona)
    {
        return AllPersonas.Contains(requestedPersona, StringComparer.OrdinalIgnoreCase)
            ? requestedPersona!.ToLowerInvariant()
            : "user";
    }

    private static AuthSession CreateSession(string persona)
    {
        return persona switch
        {
            "anonymous" => new AuthSession("anonymous", null, null),
            "error" => new AuthSession("error", null, "Demo identity provider is unavailable."),
            "admin" => new AuthSession("authenticated", CreateAdminProfile(), null),
            "member" => new AuthSession("authenticated", CreateMemberProfile(), null),
            _ => new AuthSession("authenticated", CreateUserProfile(), null)
        };
    }

    private static IReadOnlyList<NavigationCategory> CreateNavigation(AuthSession session)
    {
        var workspace = new List<NavigationItem>
        {
            new("overview", "/overview", "Overview", "Workspace health and recent activity")
        };

        if (session.Status == "authenticated")
        {
            workspace.AddRange(
            [
                new("profile", "/profile", "Profile", "Account summary and followers"),
                new("team", "/team", "Team", "Cross-functional team alignment")
            ]);
        }

        var account = session.Status == "authenticated"
            ? new[]
            {
                new NavigationItem("settings", "/settings", "Settings", "Role-aware account and workspace controls")
            }
            : Array.Empty<NavigationItem>();

        var categories = new List<NavigationCategory>
        {
            new("workspace", "Workspace", workspace)
        };

        if (account.Length > 0)
        {
            categories.Add(new NavigationCategory("account", "Account", account));
        }

        if (IsAdmin(session))
        {
            categories.Add(new NavigationCategory(
                "admin",
                "Administration",
                [
                    new NavigationItem("admin-users", "/admin/users", "Users", "Role and account review"),
                    new NavigationItem("admin-audit", "/admin/audit", "Audit Log", "Privileged actions and policy changes")
                ]));
        }

        return categories;
    }

    private static IReadOnlyList<SettingsSection> CreateSettingsSections(AuthSession session)
    {
        if (session.Status != "authenticated")
        {
            return [];
        }

        var user = session.User!;
        var sections = new List<SettingsSection>
        {
            new(
                "profile",
                "Profile",
                "Core account data adapted from the frontend-ui starter.",
                [
                    new SettingsField("display-name", "Display name", "text", user.DisplayName, true),
                    new SettingsField("email", "Email", "email", user.Email, false),
                    new SettingsField("locale", "Locale", "text", user.Locale, true),
                    new SettingsField("timezone", "Timezone", "text", user.Timezone, true)
                ]),
            new(
                "notifications",
                "Notifications",
                "Default product notification preferences.",
                [
                    new SettingsField("session-notifications", "Session notifications", "boolean", "true", true),
                    new SettingsField("product-updates", "Product updates", "boolean", "true", true),
                    new SettingsField("weekly-digest", "Weekly digest", "boolean", user.Roles.Contains("admin") ? "false" : "true", true)
                ])
        };

        if (user.Roles.Contains("member") || user.Roles.Contains("admin"))
        {
            sections.Add(new SettingsSection(
                "team",
                "Team Access",
                "Permissions and invitations for collaborative spaces.",
                [
                    new SettingsField("invite-members", "Invite members", "boolean", user.Roles.Contains("admin") ? "true" : "false", user.Roles.Contains("admin")),
                    new SettingsField("default-role", "Default role", "text", user.Roles.Contains("admin") ? "user" : "member", user.Roles.Contains("admin"))
                ]));
        }

        return sections;
    }

    private static IReadOnlyList<MetricCard> CreateMetrics(string persona)
    {
        return persona switch
        {
            "anonymous" =>
            [
                new("status", "Session", "Signed out", "Private data is hidden"),
                new("api", "API", "Online", "Health checks are passing")
            ],
            "error" =>
            [
                new("status", "Session", "Error", "Fallback rendering is active"),
                new("api", "API", "Degraded", "Auth returns a controlled error response")
            ],
            "admin" =>
            [
                new("tasks", "Open tasks", "18", "Pulled from /api/dev-state"),
                new("team", "Team members", "42", "Admin sees the full workspace"),
                new("alerts", "Unread alerts", "7", "Shown in the shell header")
            ],
            "member" =>
            [
                new("tasks", "Open tasks", "11", "Role-aware starter data"),
                new("team", "Team members", "16", "Shared team workspace"),
                new("alerts", "Unread alerts", "4", "Notification count for members")
            ],
            _ =>
            [
                new("tasks", "Open tasks", "6", "Pulled from /api/dev-state"),
                new("team", "Team members", "12", "Scoped to the current account"),
                new("alerts", "Unread alerts", "3", "Shown in the shell header")
            ]
        };
    }

    private static IReadOnlyList<ActivityItem> CreateActivity(string persona)
    {
        return persona switch
        {
            "anonymous" =>
            [
                new("activity-public", "Public preview loaded", "Anonymous visitors only see public shell data.", "Just now")
            ],
            "error" =>
            [
                new("activity-error", "Auth fallback rendered", "The identity provider returned an error session on purpose.", "Just now")
            ],
            "admin" =>
            [
                new("activity-policy", "Security policy updated", "Privileged users must complete multi-factor authentication.", "2 min ago"),
                new("activity-access", "Access review completed", "Administrative role assignments were reconciled.", "9 min ago")
            ],
            _ =>
            [
                new("activity-profile", "Profile data synchronized", "Reusable starter profile data is loaded.", "2 min ago"),
                new("activity-settings", "Settings sections filtered", "Only allowed sections remain visible.", "8 min ago")
            ]
        };
    }

    private static IReadOnlyList<ProfileFollower> CreateFollowers(string persona, AuthSession session)
    {
        if (session.Status != "authenticated")
        {
            return [];
        }

        var followers = new List<ProfileFollower>
        {
            new("follower-mary", "Mary Jackson", "mary-jackson", "Aerospace engineer", "following", "public", "2026-04-18T14:25:00.000Z"),
            new("follower-katherine", "Katherine Johnson", "katherine-johnson", "Research mathematician", "not-following", "private", "2026-04-16T09:10:00.000Z"),
            new("follower-dorothy", "Dorothy Vaughan", "dorothy-vaughan", "Team lead", "following", "workspace", "2026-04-12T17:45:00.000Z")
        };

        if (persona == "admin")
        {
            followers.Add(new ProfileFollower("follower-annie", "Annie Easley", "annie-easley", "Systems analyst", "requested", "workspace", "2026-04-10T11:30:00.000Z"));
        }

        return followers;
    }

    private static IReadOnlyList<TeamMember> CreateTeamMembers(AuthSession session)
    {
        if (session.Status != "authenticated")
        {
            return [];
        }

        var members = new List<TeamMember>
        {
            new("member-ada", "Ada Lovelace", "Product engineer", "Starter system architecture", "Focused", "Europe/Berlin"),
            new("member-grace", "Grace Hopper", "Platform lead", "API governance and delivery", "In review", "America/New_York"),
            new("member-margaret", "Margaret Hamilton", "Design systems", "Interaction model and release readiness", "Available", "America/Los_Angeles")
        };

        if (IsAdmin(session))
        {
            members.Add(new TeamMember("member-barbara", "Barbara Liskov", "Admin sponsor", "Security, access, and operating model", "On call", "Europe/London"));
        }

        return members;
    }

    private static AdminState CreateAdminState()
    {
        var users = new[]
        {
            new AdminUser("user-dev-admin", "Admin User", "admin@example.com", ["admin"], "active", "2026-01-10T09:00:00.000Z", "2026-04-22T16:30:00.000Z"),
            new AdminUser("user-dev-member", "Member User", "member@example.com", ["member"], "invited", "2026-04-20T10:15:00.000Z", null),
            new AdminUser("user-dev-user", "Demo User", "user@user.com", ["user"], "active", "2026-02-18T11:20:00.000Z", "2026-04-22T15:35:00.000Z"),
            new AdminUser("user-dev-suspended", "Suspended User", "suspended@example.com", ["user"], "suspended", "2026-02-01T08:00:00.000Z", "2026-03-08T13:10:00.000Z")
        };

        return new AdminState(
            Metrics:
            [
                new MetricCard("users", "Users", users.Length.ToString(), "Total workspace accounts"),
                new MetricCard("admins", "Admins", users.Count(user => user.Roles.Contains("admin")).ToString(), "Users with admin access"),
                new MetricCard("audit", "Audit events", "4", "Recent privileged actions")
            ],
            Users: users,
            AuditEvents:
            [
                new AuditEvent("audit-mfa", "MFA requirement updated", "Admin User", "workspace security", "warning", "Privileged users must complete multi-factor authentication.", "2026-04-22T16:10:00.000Z"),
                new AuditEvent("audit-invite", "User invited", "Admin User", "member@example.com", "info", "A workspace invitation was sent.", "2026-04-20T10:15:00.000Z"),
                new AuditEvent("audit-role", "Role changed", "Admin User", "user@user.com", "info", "User role was set to user.", "2026-04-18T14:45:00.000Z"),
                new AuditEvent("audit-suspend", "User suspended", "Admin User", "suspended@example.com", "critical", "A user account was suspended after an access review.", "2026-03-08T13:12:00.000Z")
            ],
            Settings: new AdminWorkspaceSettings(true, "user", "90d", true)
        );
    }

    private static bool IsAdmin(AuthSession session)
    {
        return session.Status == "authenticated" && session.User!.Roles.Contains("admin");
    }

    private static UserProfile CreateUserProfile()
    {
        return new UserProfile(
            Id: "user-dev-user",
            Username: "demo-user",
            DisplayName: "Demo User",
            Email: "user@user.com",
            Title: "Product engineer",
            Bio: "Builds reusable frontend systems for product teams.",
            Locale: "en-US",
            Timezone: "Europe/Berlin",
            Roles: ["user"],
            Permissions: ["profile:write"]
        );
    }

    private static UserProfile CreateMemberProfile()
    {
        return new UserProfile(
            Id: "user-dev-member",
            Username: "team-member",
            DisplayName: "Member User",
            Email: "member@example.com",
            Title: "Operations coordinator",
            Bio: "Keeps team workflows and handoffs aligned.",
            Locale: "en-US",
            Timezone: "Europe/London",
            Roles: ["member"],
            Permissions: ["profile:write", "team:read"]
        );
    }

    private static UserProfile CreateAdminProfile()
    {
        return new UserProfile(
            Id: "user-dev-admin",
            Username: "admin-user",
            DisplayName: "Admin User",
            Email: "admin@example.com",
            Title: "Workspace administrator",
            Bio: "Owns access policies, audit review, and operating defaults.",
            Locale: "en-US",
            Timezone: "America/New_York",
            Roles: ["admin"],
            Permissions: ["profile:write", "settings:write", "audit-log:read", "users:manage"]
        );
    }
}
