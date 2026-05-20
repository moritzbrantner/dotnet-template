import type { DevState, Persona } from '../types'

export function createDevState(persona: Persona = 'user'): DevState {
  const authenticated = persona !== 'anonymous' && persona !== 'error'
  const admin = persona === 'admin'

  return {
    persona,
    session: authenticated
      ? {
          status: 'authenticated',
          user: {
            id: 'user-1',
            username: 'ada',
            displayName: 'Ada Lovelace',
            email: 'ada@example.test',
            title: admin ? 'Platform administrator' : 'Developer',
            bio: 'Builds starters.',
            locale: 'en-US',
            timezone: 'UTC',
            roles: admin ? ['admin', 'user'] : ['user'],
            permissions: admin ? ['notes:write', 'admin:read'] : ['notes:write'],
          },
          error: null,
        }
      : {
          status: persona === 'error' ? 'error' : 'anonymous',
          user: null,
          error: persona === 'error' ? 'Session lookup failed.' : null,
        },
    navigation: [
      {
        key: 'workspace',
        label: 'Workspace',
        items: [
          { key: 'overview', href: '/overview', label: 'Overview', description: 'Workspace summary' },
          { key: 'profile', href: '/profile', label: 'Profile', description: 'Account details' },
        ],
      },
      ...(admin
        ? [
            {
              key: 'admin',
              label: 'Admin',
              items: [{ key: 'admin-users', href: '/admin/users', label: 'Users', description: 'Manage access' }],
            },
          ]
        : []),
    ],
    settingsSections: [
      {
        key: 'profile',
        title: 'Profile',
        description: 'Personal workspace settings',
        fields: [{ key: 'timezone', label: 'Timezone', type: 'text', value: 'UTC', enabled: authenticated }],
      },
    ],
    notifications: authenticated ? { unreadCount: admin ? 4 : 2 } : null,
    metrics: [
      { key: 'notes', label: 'Notes', value: '3', detail: 'Persisted locally' },
      { key: 'latency', label: 'API latency', value: '24 ms', detail: 'Mock response' },
    ],
    activity: [
      {
        id: 'activity-1',
        title: 'Starter state loaded',
        detail: 'The React shell resolved its API contract.',
        timestamp: '2026-05-01 08:00',
      },
    ],
    followers: [
      {
        id: 'follower-1',
        displayName: 'Grace Hopper',
        username: 'grace',
        title: 'Reviewer',
        relationship: 'teammate',
        visibility: 'workspace',
        followedAt: '2026-05-01T08:00:00Z',
      },
    ],
    teamMembers: [
      {
        id: 'member-1',
        displayName: 'Grace Hopper',
        role: 'Reviewer',
        focus: 'Testing',
        availability: 'Available',
        timezone: 'UTC',
      },
    ],
    admin: admin
      ? {
          metrics: [{ key: 'users', label: 'Users', value: '12', detail: 'Active workspace accounts' }],
          users: [
            {
              id: 'admin-user-1',
              displayName: 'Ada Lovelace',
              email: 'ada@example.test',
              roles: ['admin'],
              status: 'active',
              createdAt: '2026-05-01T08:00:00Z',
              lastActiveAt: '2026-05-01T09:00:00Z',
            },
          ],
          auditEvents: [
            {
              id: 'audit-1',
              action: 'user.updated',
              actorName: 'Ada Lovelace',
              target: 'Workspace users',
              severity: 'info',
              description: 'Updated starter account metadata.',
              createdAt: '2026-05-01T08:00:00Z',
            },
          ],
          settings: {
            inviteOnly: true,
            defaultRole: 'member',
            auditLogRetention: '90 days',
            requireMfa: true,
          },
        }
      : null,
  }
}
