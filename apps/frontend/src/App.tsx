import { useEffect, useState } from 'react'
import './App.css'
import { loadDevState } from './api'
import type {
  ActivityItem,
  AdminState,
  DevState,
  NavigationCategory,
  NavigationItem,
  Persona,
  TeamMember,
} from './types'

const personas: Persona[] = ['user', 'member', 'admin', 'anonymous', 'error']

function App() {
  const [persona, setPersona] = useState<Persona>('user')
  const [state, setState] = useState<DevState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState('/overview')

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    loadDevState(persona)
      .then((nextState) => {
        if (cancelled) {
          return
        }

        setState(nextState)
      })
      .catch((caughtError: unknown) => {
        if (cancelled) {
          return
        }

        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load starter state.')
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [persona])

  useEffect(() => {
    if (state && !hasNavigationItem(state.navigation, currentPath)) {
      setCurrentPath(getDefaultPath(state.navigation))
    }
  }, [currentPath, state])

  const selectedItem = state ? findNavigationItem(state.navigation, currentPath) : null
  const notificationCount = state?.notifications?.unreadCount ?? 0
  const isAuthenticated = state?.session.status === 'authenticated'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">frontend-ui starter</p>
          <h1>Orbit Console</h1>
          <p className="brand-copy">
            A self-contained frontend and .NET Web API based on the account, team, settings, and admin
            surfaces from <code>@moritzbrantner/frontend-ui</code>.
          </p>
        </div>

        <div className="persona-panel">
          <p className="section-label">Persona</p>
          <div className="persona-grid">
            {personas.map((option) => (
              <button
                key={option}
                type="button"
                className={option === persona ? 'persona-button active' : 'persona-button'}
                onClick={() => setPersona(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <nav className="navigation-panel" aria-label="Primary navigation">
          <p className="section-label">Navigation</p>
          {state?.navigation.map((category) => (
            <section key={category.key} className="nav-category">
              <h2>{category.label}</h2>
              <div className="nav-list">
                {category.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={item.href === currentPath ? 'nav-item active' : 'nav-item'}
                    onClick={() => setCurrentPath(item.href)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="hero-panel">
          <div>
            <p className="eyebrow">Starter dashboard</p>
            <h2>{selectedItem?.label ?? 'Overview'}</h2>
            <p className="hero-copy">
              Role-aware navigation, guarded rendering, notification state, and administration surfaces all come
              from the matching Web API.
            </p>
          </div>

          <div className="hero-meta">
            <StatusPill label="Session" value={formatSessionStatus(state?.session.status)} />
            <StatusPill label="Persona" value={persona} />
            <StatusPill label="Alerts" value={String(notificationCount)} />
          </div>
        </header>

        {error ? <ErrorBanner message={error} /> : null}

        {loading ? <LoadingState /> : null}

        {!loading && state ? (
          <>
            <section className="overview-strip">
              <AccountCard state={state} />
              <MetricsPanel metrics={state.metrics} />
            </section>

            <section className="content-grid">
              <div className="primary-column">{renderPage(currentPath, state)}</div>
              <aside className="secondary-column">
                <ActivityPanel activity={state.activity} />
                <ApiContractPanel state={state} />
                {isAuthenticated ? <PermissionPanel permissions={state.session.user!.permissions} /> : null}
              </aside>
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}

function renderPage(currentPath: string, state: DevState) {
  switch (currentPath) {
    case '/profile':
      return <ProfilePage state={state} />
    case '/team':
      return <TeamPage members={state.teamMembers} />
    case '/settings':
      return <SettingsPage state={state} />
    case '/admin/users':
      return <AdminUsersPage admin={state.admin} />
    case '/admin/audit':
      return <AdminAuditPage admin={state.admin} />
    default:
      return <OverviewPage state={state} />
  }
}

function OverviewPage({ state }: { state: DevState }) {
  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="eyebrow">Workspace</p>
        <h3>Overview</h3>
        <p>
          The backend pre-filters starter data by persona. Anonymous and error sessions keep the shell public,
          while authenticated personas unlock progressively broader account and admin views.
        </p>
      </div>

      <div className="feature-grid">
        <article className="feature-card accent-card">
          <p className="section-label">Starter principles</p>
          <ul className="detail-list">
            <li>Guarded rendering derived from the session status.</li>
            <li>Navigation categories filtered before the UI renders them.</li>
            <li>Settings sections vary by role instead of being hidden client-side only.</li>
          </ul>
        </article>

        <article className="feature-card">
          <p className="section-label">Notifications</p>
          <h4>{state.notifications?.unreadCount ?? 0} unread alerts</h4>
          <p>
            Admins surface a higher alert count and additional audit activity, matching the backend persona state.
          </p>
        </article>

        <article className="feature-card">
          <p className="section-label">API surface</p>
          <h4>`/api/dev-state`</h4>
          <p>
            The frontend fetches one starter payload, with additional matching endpoints for session, settings,
            followers, and navigation.
          </p>
        </article>
      </div>
    </section>
  )
}

function ProfilePage({ state }: { state: DevState }) {
  if (state.session.status !== 'authenticated') {
    return <GuardedEmptyState title="Profile unavailable" copy="Sign in with a user, member, or admin persona." />
  }

  const user = state.session.user!

  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="eyebrow">Account</p>
        <h3>{user.displayName}</h3>
        <p>{user.bio}</p>
      </div>

      <div className="profile-summary">
        <article className="feature-card">
          <p className="section-label">Identity</p>
          <h4>@{user.username}</h4>
          <p>{user.title}</p>
          <div className="chip-row">
            {user.roles.map((role) => (
              <span key={role} className="chip">
                {role}
              </span>
            ))}
          </div>
        </article>

        <article className="feature-card">
          <p className="section-label">Locale</p>
          <h4>{user.locale}</h4>
          <p>{user.timezone}</p>
          <p>{user.email}</p>
        </article>
      </div>

      <div className="list-section">
        <div className="section-heading compact">
          <p className="eyebrow">Followers</p>
          <h3>{state.followers.length} connected profiles</h3>
        </div>

        <div className="stack">
          {state.followers.map((follower) => (
            <article key={follower.id} className="list-card">
              <div>
                <strong>{follower.displayName}</strong>
                <p>
                  @{follower.username} · {follower.title}
                </p>
              </div>
              <div className="list-meta">
                <span className="chip subtle">{follower.relationship}</span>
                <span className="chip subtle">{follower.visibility}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function TeamPage({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return <GuardedEmptyState title="Team surface unavailable" copy="Authenticated personas unlock team workspace data." />
  }

  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="eyebrow">Collaboration</p>
        <h3>Team operating model</h3>
        <p>Representative team cards aligned with the same persona-driven starter contract as the rest of the shell.</p>
      </div>

      <div className="team-grid">
        {members.map((member) => (
          <article key={member.id} className="feature-card">
            <p className="section-label">{member.role}</p>
            <h4>{member.displayName}</h4>
            <p>{member.focus}</p>
            <div className="chip-row">
              <span className="chip subtle">{member.availability}</span>
              <span className="chip subtle">{member.timezone}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function SettingsPage({ state }: { state: DevState }) {
  if (state.settingsSections.length === 0) {
    return <GuardedEmptyState title="Settings unavailable" copy="Anonymous and error personas do not expose account settings." />
  }

  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="eyebrow">Configuration</p>
        <h3>Role-aware settings</h3>
        <p>The backend returns only the starter sections the current persona can access.</p>
      </div>

      <div className="stack">
        {state.settingsSections.map((section) => (
          <article key={section.key} className="settings-card">
            <div className="settings-header">
              <div>
                <p className="section-label">{section.title}</p>
                <h4>{section.description}</h4>
              </div>
            </div>

            <div className="settings-fields">
              {section.fields.map((field) => (
                <div key={field.key} className="settings-row">
                  <div>
                    <strong>{field.label}</strong>
                    <p>{field.type}</p>
                  </div>
                  <div className="settings-value">
                    <span>{field.value ?? 'Not set'}</span>
                    <span className={field.enabled ? 'field-state enabled' : 'field-state'}>{field.enabled ? 'Editable' : 'Locked'}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function AdminUsersPage({ admin }: { admin: AdminState | null }) {
  if (!admin) {
    return <GuardedEmptyState title="Admin users unavailable" copy="Switch to the admin persona to inspect workspace users." />
  }

  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="eyebrow">Administration</p>
        <h3>User and role review</h3>
        <p>This surface mirrors the administrative extension points from the frontend-ui starter.</p>
      </div>

      <div className="feature-grid">
        {admin.metrics.map((metric) => (
          <article key={metric.key} className="feature-card">
            <p className="section-label">{metric.label}</p>
            <h4>{metric.value}</h4>
            <p>{metric.detail}</p>
          </article>
        ))}
      </div>

      <div className="stack">
        {admin.users.map((user) => (
          <article key={user.id} className="list-card">
            <div>
              <strong>{user.displayName}</strong>
              <p>
                {user.email} · {user.roles.join(', ')}
              </p>
            </div>
            <div className="list-meta">
              <span className="chip subtle">{user.status}</span>
              <span className="muted-text">{user.lastActiveAt ? formatIsoDate(user.lastActiveAt) : 'Pending invite'}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function AdminAuditPage({ admin }: { admin: AdminState | null }) {
  if (!admin) {
    return <GuardedEmptyState title="Audit log unavailable" copy="Only the admin persona can inspect privileged activity." />
  }

  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="eyebrow">Governance</p>
        <h3>Audit and policy timeline</h3>
        <p>Workspace defaults and privileged actions come from the same persona-specific admin payload.</p>
      </div>

      <article className="feature-card">
        <p className="section-label">Workspace policy</p>
        <h4>{admin.settings.requireMfa ? 'Multi-factor required' : 'Password only'}</h4>
        <p>
          Default role: {admin.settings.defaultRole} · Invite only: {admin.settings.inviteOnly ? 'yes' : 'no'} ·
          Retention: {admin.settings.auditLogRetention}
        </p>
      </article>

      <div className="stack">
        {admin.auditEvents.map((event) => (
          <article key={event.id} className="list-card">
            <div>
              <strong>{event.action}</strong>
              <p>
                {event.actorName} targeted {event.target}
              </p>
              <p className="muted-text">{event.description}</p>
            </div>
            <div className="list-meta">
              <span className={`chip subtle severity-${event.severity}`}>{event.severity}</span>
              <span className="muted-text">{formatIsoDate(event.createdAt)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function AccountCard({ state }: { state: DevState }) {
  const user = state.session.user

  return (
    <article className="account-card">
      <div className="account-header">
        <p className="section-label">Account</p>
        <span className={state.session.status === 'authenticated' ? 'live-dot' : 'live-dot muted'} />
      </div>
      <h3>{user?.displayName ?? 'Guest preview'}</h3>
      <p>{user?.title ?? state.session.error ?? 'Public shell with no private data.'}</p>
      <div className="chip-row">
        {(user?.roles ?? [state.session.status]).map((value) => (
          <span key={value} className="chip">
            {value}
          </span>
        ))}
      </div>
    </article>
  )
}

function MetricsPanel({ metrics }: { metrics: DevState['metrics'] }) {
  return (
    <section className="metrics-panel">
      {metrics.map((metric) => (
        <article key={metric.key} className="metric-card">
          <p>{metric.label}</p>
          <strong>{metric.value}</strong>
          <span>{metric.detail}</span>
        </article>
      ))}
    </section>
  )
}

function ActivityPanel({ activity }: { activity: ActivityItem[] }) {
  return (
    <section className="rail-card">
      <div className="section-heading compact">
        <p className="eyebrow">Recent activity</p>
        <h3>Live shell feed</h3>
      </div>

      <div className="stack">
        {activity.map((item) => (
          <article key={item.id} className="timeline-item">
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
            <span>{item.timestamp}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

function ApiContractPanel({ state }: { state: DevState }) {
  return (
    <section className="rail-card">
      <div className="section-heading compact">
        <p className="eyebrow">Contract</p>
        <h3>Backend shape</h3>
      </div>

      <div className="contract-lines">
        <code>persona: "{state.persona}"</code>
        <code>session.status: "{state.session.status}"</code>
        <code>navigation: {state.navigation.length} categories</code>
        <code>settingsSections: {state.settingsSections.length}</code>
        <code>followers: {state.followers.length}</code>
      </div>
    </section>
  )
}

function PermissionPanel({ permissions }: { permissions: string[] }) {
  return (
    <section className="rail-card">
      <div className="section-heading compact">
        <p className="eyebrow">Access</p>
        <h3>Resolved permissions</h3>
      </div>

      <div className="chip-row">
        {permissions.map((permission) => (
          <span key={permission} className="chip subtle">
            {permission}
          </span>
        ))}
      </div>
    </section>
  )
}

function GuardedEmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <section className="page-section">
      <article className="empty-card">
        <p className="section-label">Guarded view</p>
        <h3>{title}</h3>
        <p>{copy}</p>
      </article>
    </section>
  )
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="error-banner" role="alert">
      <strong>Request failed.</strong>
      <span>{message}</span>
    </div>
  )
}

function LoadingState() {
  return (
    <section className="loading-state" aria-live="polite">
      <div className="loading-pulse" />
      <p>Loading starter state from the .NET Web API…</p>
    </section>
  )
}

function hasNavigationItem(categories: NavigationCategory[], targetPath: string) {
  return categories.some((category) => category.items.some((item) => item.href === targetPath))
}

function getDefaultPath(categories: NavigationCategory[]) {
  return categories[0]?.items[0]?.href ?? '/overview'
}

function findNavigationItem(categories: NavigationCategory[], targetPath: string): NavigationItem | null {
  for (const category of categories) {
    const found = category.items.find((item) => item.href === targetPath)

    if (found) {
      return found
    }
  }

  return null
}

function formatSessionStatus(status: DevState['session']['status'] | undefined) {
  if (!status) {
    return 'loading'
  }

  return status.replace('-', ' ')
}

function formatIsoDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default App
