export type Persona = 'user' | 'member' | 'admin' | 'anonymous' | 'error'

export type DevState = {
  persona: Persona
  session: AuthSession
  navigation: NavigationCategory[]
  settingsSections: SettingsSection[]
  notifications: NotificationSummary | null
  metrics: MetricCard[]
  activity: ActivityItem[]
  followers: ProfileFollower[]
  teamMembers: TeamMember[]
  admin: AdminState | null
}

export type AuthSession = {
  status: 'authenticated' | 'anonymous' | 'error'
  user: UserProfile | null
  error: string | null
}

export type UserProfile = {
  id: string
  username: string
  displayName: string
  email: string
  title: string
  bio: string
  locale: string
  timezone: string
  roles: string[]
  permissions: string[]
}

export type NavigationCategory = {
  key: string
  label: string
  items: NavigationItem[]
}

export type NavigationItem = {
  key: string
  href: string
  label: string
  description: string
}

export type SettingsSection = {
  key: string
  title: string
  description: string
  fields: SettingsField[]
}

export type SettingsField = {
  key: string
  label: string
  type: string
  value: string | null
  enabled: boolean
}

export type NotificationSummary = {
  unreadCount: number
}

export type MetricCard = {
  key: string
  label: string
  value: string
  detail: string
}

export type ActivityItem = {
  id: string
  title: string
  detail: string
  timestamp: string
}

export type ProfileFollower = {
  id: string
  displayName: string
  username: string
  title: string
  relationship: string
  visibility: string
  followedAt: string
}

export type TeamMember = {
  id: string
  displayName: string
  role: string
  focus: string
  availability: string
  timezone: string
}

export type AdminState = {
  metrics: MetricCard[]
  users: AdminUser[]
  auditEvents: AuditEvent[]
  settings: AdminWorkspaceSettings
}

export type AdminUser = {
  id: string
  displayName: string
  email: string
  roles: string[]
  status: string
  createdAt: string
  lastActiveAt: string | null
}

export type AuditEvent = {
  id: string
  action: string
  actorName: string
  target: string
  severity: string
  description: string
  createdAt: string
}

export type AdminWorkspaceSettings = {
  inviteOnly: boolean
  defaultRole: string
  auditLogRetention: string
  requireMfa: boolean
}

export type WorkspaceNote = {
  id: number
  message: string
  createdBy: string
  persona: string
  createdAt: string
}

export type CreateWorkspaceNoteRequest = {
  message: string
  createdBy?: string | null
  persona?: Persona | string | null
}

export type UpdateWorkspaceNoteRequest = {
  message: string
  createdBy?: string | null
  persona?: Persona | string | null
}
