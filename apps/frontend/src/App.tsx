import type { ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import CancelRounded from '@mui/icons-material/CancelRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import DeleteRounded from '@mui/icons-material/DeleteRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import NotificationsRounded from '@mui/icons-material/NotificationsRounded'
import PersonRounded from '@mui/icons-material/PersonRounded'
import SaveRounded from '@mui/icons-material/SaveRounded'
import ShieldRounded from '@mui/icons-material/ShieldRounded'
import StorageRounded from '@mui/icons-material/StorageRounded'
import { personas, useAppStore } from './app-store'
import type {
  ActivityItem,
  AdminState,
  DevState,
  TeamMember,
  WorkspaceNote,
} from './types'

const surfaceSx = {
  p: 3,
  borderRadius: 6,
  backgroundColor: 'background.paper',
}

const App = observer(function App() {
  const appStore = useAppStore()
  const {
    currentPath,
    error,
    isAuthenticated,
    loading,
    notificationCount,
    persona,
    selectedItem,
    state,
  } = appStore

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '320px minmax(0, 1fr)' },
        gap: 2,
        p: { xs: 2, md: 3 },
      }}
    >
      <Paper
        sx={{
          ...surfaceSx,
          position: { lg: 'sticky' },
          top: { lg: 24 },
          alignSelf: 'start',
          backgroundColor: alpha('#10212c', 0.9),
          color: '#edf5f7',
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={1.5}>
            <Typography variant="overline" sx={{ color: '#ffb197' }}>
              frontend-ui starter
            </Typography>
            <Typography variant="h4">Orbit Console</Typography>
            <Typography sx={{ color: 'rgba(237, 245, 247, 0.8)', lineHeight: 1.6 }}>
              A Material UI shell backed by the .NET Web API, with local Postgres persistence for workspace notes.
            </Typography>
          </Stack>

          <Stack spacing={1.25}>
            <Typography variant="overline" sx={{ color: '#ffb197' }}>
              Persona
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 1,
              }}
            >
              {personas.map((option) => (
                <Button
                  key={option}
                  variant={option === persona ? 'contained' : 'outlined'}
                  color={option === persona ? 'secondary' : 'inherit'}
                  onClick={() => appStore.setPersona(option)}
                  sx={{
                    justifyContent: 'flex-start',
                    borderRadius: 4,
                    borderColor: 'rgba(255,255,255,0.18)',
                    color: option === persona ? '#17212b' : '#edf5f7',
                    backgroundColor: option === persona ? 'secondary.light' : 'rgba(255,255,255,0.04)',
                  }}
                >
                  {option}
                </Button>
              ))}
            </Box>
          </Stack>

          <Stack spacing={1.25}>
            <Typography variant="overline" sx={{ color: '#ffb197' }}>
              Navigation
            </Typography>
            {state?.navigation.map((category) => (
              <Box key={category.key}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {category.label}
                </Typography>
                <List disablePadding sx={{ display: 'grid', gap: 0.75 }}>
                  {category.items.map((item) => (
                    <ListItem key={item.key} disablePadding>
                      <ListItemButton
                        selected={item.href === currentPath}
                        onClick={() => appStore.setCurrentPath(item.href)}
                        sx={{
                          borderRadius: 4,
                          alignItems: 'flex-start',
                          px: 1.5,
                          py: 1.25,
                          '&.Mui-selected': {
                            backgroundColor: alpha('#ff7d5f', 0.28),
                          },
                          '&.Mui-selected:hover': {
                            backgroundColor: alpha('#ff7d5f', 0.36),
                          },
                        }}
                      >
                        <Stack spacing={0.25}>
                          <Typography sx={{ fontWeight: 700 }}>{item.label}</Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(237, 245, 247, 0.78)' }}>
                            {item.description}
                          </Typography>
                        </Stack>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ display: 'grid', gap: 2 }}>
        <Paper
          sx={{
            ...surfaceSx,
            display: 'flex',
            flexDirection: { xs: 'column', xl: 'row' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Stack spacing={1.25}>
            <Typography variant="overline" color="secondary.main">
              Starter dashboard
            </Typography>
            <Typography variant="h3">{selectedItem?.label ?? 'Overview'}</Typography>
            <Typography sx={{ maxWidth: 760, lineHeight: 1.7 }}>
              Role-aware navigation, guarded rendering, notification state, and a persisted Postgres-backed notes
              panel all live in the same starter shell now.
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <StatusPill label="Session" value={appStore.sessionStatusLabel} icon={<ShieldRounded fontSize="small" />} />
            <StatusPill label="Persona" value={persona} icon={<PersonRounded fontSize="small" />} />
            <StatusPill label="Alerts" value={String(notificationCount)} icon={<NotificationsRounded fontSize="small" />} />
            <StatusPill label="Storage" value="Postgres" icon={<StorageRounded fontSize="small" />} />
          </Stack>
        </Paper>

        {error ? <Alert severity="error">Starter state request failed: {error}</Alert> : null}

        {loading ? (
          <Paper sx={{ ...surfaceSx, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Loading starter shell...</Typography>
          </Paper>
        ) : null}

        {!loading && state ? (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', xl: '1.2fr 1.8fr' },
                gap: 2,
              }}
            >
              <AccountCard state={state} />
              <MetricsPanel metrics={state.metrics} />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.65fr) minmax(320px, 0.95fr)' },
                gap: 2,
              }}
            >
              <Box>{renderPage(currentPath, state)}</Box>
              <Stack spacing={2}>
                <ActivityPanel activity={state.activity} />
                <ApiContractPanel state={state} />
                <WorkspaceNotesPanel />
                {isAuthenticated ? <PermissionPanel permissions={state.session.user!.permissions} /> : null}
              </Stack>
            </Box>
          </>
        ) : null}
      </Box>
    </Box>
  )
})

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
    <Stack spacing={2}>
      <SectionHeading
        eyebrow="Workspace"
        title="Overview"
        copy="The backend still pre-filters starter data by persona, while the frontend now renders it with Material UI surfaces instead of a custom CSS shell."
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <FeatureCard
          eyebrow="Starter principles"
          title="Guarded views"
          copy="Navigation, settings, and admin areas are all filtered from the backend before the UI renders them."
        />
        <FeatureCard
          eyebrow="Notifications"
          title={`${state.notifications?.unreadCount ?? 0} unread alerts`}
          copy="Admin personas surface more alert volume and additional audit activity from the same starter payload."
        />
        <FeatureCard eyebrow="Persistence" title="/api/notes" copy="Workspace notes are stored in local Postgres and rendered back into the shell." />
      </Box>
    </Stack>
  )
}

function ProfilePage({ state }: { state: DevState }) {
  if (state.session.status !== 'authenticated') {
    return <GuardedEmptyState title="Profile unavailable" copy="Sign in with a user, member, or admin persona." />
  }

  const user = state.session.user!

  return (
    <Stack spacing={2}>
      <SectionHeading eyebrow="Account" title={user.displayName} copy={user.bio} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        <FeatureCard
          eyebrow="Identity"
          title={`@${user.username}`}
          copy={user.title}
          footer={
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {user.roles.map((role) => (
                  <Chip key={role} label={role} color="secondary" variant="outlined" />
                ))}
            </Stack>
          }
        />
        <FeatureCard eyebrow="Locale" title={user.locale} copy={`${user.timezone} · ${user.email}`} />
      </Box>

      <Paper sx={surfaceSx}>
        <Stack spacing={2}>
          <SectionHeading eyebrow="Followers" title={`${state.followers.length} connected profiles`} compact />
          <Stack spacing={1.5}>
            {state.followers.map((follower) => (
              <ListRow
                key={follower.id}
                title={follower.displayName}
                subtitle={`@${follower.username} · ${follower.title}`}
                meta={[follower.relationship, follower.visibility]}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  )
}

function TeamPage({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return <GuardedEmptyState title="Team surface unavailable" copy="Authenticated personas unlock team workspace data." />
  }

  return (
    <Stack spacing={2}>
      <SectionHeading
        eyebrow="Collaboration"
        title="Team operating model"
        copy="Representative team cards aligned with the same persona-driven starter contract as the rest of the shell."
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        {members.map((member) => (
          <FeatureCard
            key={member.id}
            eyebrow={member.role}
            title={member.displayName}
            copy={member.focus}
            footer={
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Chip label={member.availability} variant="outlined" />
                <Chip label={member.timezone} variant="outlined" />
              </Stack>
            }
          />
        ))}
      </Box>
    </Stack>
  )
}

function SettingsPage({ state }: { state: DevState }) {
  if (state.settingsSections.length === 0) {
    return <GuardedEmptyState title="Settings unavailable" copy="Anonymous and error personas do not expose account settings." />
  }

  return (
    <Stack spacing={2}>
      <SectionHeading eyebrow="Configuration" title="Role-aware settings" copy="The backend returns only the starter sections the current persona can access." />

      {state.settingsSections.map((section) => (
        <Paper key={section.key} sx={surfaceSx}>
          <Stack spacing={2}>
            <SectionHeading eyebrow={section.title} title={section.description} compact />
            <Stack spacing={1.25}>
              {section.fields.map((field) => (
                <ListRow
                  key={field.key}
                  title={field.label}
                  subtitle={field.type}
                  meta={[field.value ?? 'Not set', field.enabled ? 'Editable' : 'Locked']}
                />
              ))}
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Stack>
  )
}

function AdminUsersPage({ admin }: { admin: AdminState | null }) {
  if (!admin) {
    return <GuardedEmptyState title="Admin users unavailable" copy="Switch to the admin persona to inspect workspace users." />
  }

  return (
    <Stack spacing={2}>
      <SectionHeading eyebrow="Administration" title="User and role review" copy="This surface mirrors the administrative extension points from the starter." />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        {admin.metrics.map((metric) => (
          <FeatureCard key={metric.key} eyebrow={metric.label} title={metric.value} copy={metric.detail} />
        ))}
      </Box>

      <Paper sx={surfaceSx}>
        <Stack spacing={1.5}>
          {admin.users.map((user) => (
            <ListRow
              key={user.id}
              title={user.displayName}
              subtitle={`${user.email} · ${user.roles.join(', ')}`}
              meta={[user.status, user.lastActiveAt ? formatIsoDate(user.lastActiveAt) : 'Pending invite']}
            />
          ))}
        </Stack>
      </Paper>
    </Stack>
  )
}

function AdminAuditPage({ admin }: { admin: AdminState | null }) {
  if (!admin) {
    return <GuardedEmptyState title="Audit log unavailable" copy="Only the admin persona can inspect privileged activity." />
  }

  return (
    <Stack spacing={2}>
      <SectionHeading eyebrow="Governance" title="Audit and policy timeline" copy="Workspace defaults and privileged actions come from the same persona-specific admin payload." />

      <FeatureCard
        eyebrow="Workspace policy"
        title={admin.settings.requireMfa ? 'Multi-factor required' : 'Password only'}
        copy={`Default role: ${admin.settings.defaultRole} · Invite only: ${admin.settings.inviteOnly ? 'yes' : 'no'} · Retention: ${admin.settings.auditLogRetention}`}
      />

      <Paper sx={surfaceSx}>
        <Stack spacing={1.5}>
          {admin.auditEvents.map((event) => (
            <ListRow
              key={event.id}
              title={event.action}
              subtitle={`${event.actorName} targeted ${event.target}`}
              detail={event.description}
              meta={[event.severity, formatIsoDate(event.createdAt)]}
            />
          ))}
        </Stack>
      </Paper>
    </Stack>
  )
}

function AccountCard({ state }: { state: DevState }) {
  const user = state.session.user

  return (
    <Paper
      sx={{
        ...surfaceSx,
        color: '#edf5f7',
        background: 'linear-gradient(145deg, rgba(14, 30, 42, 0.96), rgba(31, 70, 77, 0.88))',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="overline" sx={{ color: '#ffb197' }}>
            Account
          </Typography>
          <Chip
            size="small"
            label={state.session.status === 'authenticated' ? 'Live' : 'Preview'}
            sx={{
              color: '#edf5f7',
              backgroundColor: state.session.status === 'authenticated' ? alpha('#75f4c8', 0.22) : alpha('#f3b070', 0.22),
            }}
          />
        </Stack>
        <Typography variant="h4">{user?.displayName ?? 'Guest preview'}</Typography>
        <Typography sx={{ color: 'rgba(237, 245, 247, 0.82)', lineHeight: 1.7 }}>
          {user?.title ?? state.session.error ?? 'Public shell with no private data.'}
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {(user?.roles ?? [state.session.status]).map((value) => (
            <Chip key={value} label={value} color="secondary" />
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}

function MetricsPanel({ metrics }: { metrics: DevState['metrics'] }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 2 }}>
      {metrics.map((metric) => (
        <Paper key={metric.key} sx={surfaceSx}>
          <Stack spacing={0.75}>
            <Typography color="text.secondary">{metric.label}</Typography>
            <Typography variant="h4">{metric.value}</Typography>
            <Typography variant="body2" color="text.secondary">
              {metric.detail}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Box>
  )
}

function ActivityPanel({ activity }: { activity: ActivityItem[] }) {
  return (
    <Paper sx={surfaceSx}>
      <Stack spacing={2}>
        <SectionHeading eyebrow="Recent activity" title="Live shell feed" compact />
        <Stack spacing={1.5}>
          {activity.map((item) => (
            <Box key={item.id}>
              <Stack spacing={0.5}>
                <Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.detail}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.timestamp}
                </Typography>
              </Stack>
              <Divider sx={{ mt: 1.5 }} />
            </Box>
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}

function ApiContractPanel({ state }: { state: DevState }) {
  const lines = [
    `persona: "${state.persona}"`,
    `session.status: "${state.session.status}"`,
    `navigation: ${state.navigation.length} categories`,
    `settingsSections: ${state.settingsSections.length}`,
    `followers: ${state.followers.length}`,
  ]

  return (
    <Paper sx={surfaceSx}>
      <Stack spacing={2}>
        <SectionHeading eyebrow="Contract" title="Backend shape" compact />
        <Stack spacing={1}>
          {lines.map((line) => (
            <Paper key={line} variant="outlined" sx={{ p: 1.25, borderRadius: 3, backgroundColor: alpha('#0f766e', 0.05) }}>
              <Typography component="code" sx={{ fontFamily: '"IBM Plex Mono", "SFMono-Regular", monospace', fontSize: '0.88rem' }}>
                {line}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}

const WorkspaceNotesPanel = observer(function WorkspaceNotesPanel() {
  const appStore = useAppStore()
  const { creatingNote, noteDraft: draft, notes, notesError: error, notesLoading: loading } = appStore
  const remaining = 280 - draft.length

  return (
    <Paper sx={surfaceSx}>
      <Stack spacing={2}>
        <SectionHeading eyebrow="Persistence" title="Workspace notes" compact />
        <Typography variant="body2" color="text.secondary">
          Notes in this panel are persisted through the C# API into your local Postgres database.
        </Typography>
        <TextField
          label="New note"
          multiline
          minRows={3}
          value={draft}
          onChange={(event) => appStore.setNoteDraft(event.target.value)}
          error={draft.length > 280}
          helperText={`${remaining} characters remaining`}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveRounded />}
          disabled={creatingNote || !draft.trim() || draft.length > 280}
          onClick={() => void appStore.createNote()}
        >
          {creatingNote ? 'Saving...' : 'Save to Postgres'}
        </Button>
        {error ? <Alert severity="error">Notes request failed: {error}</Alert> : null}
        {loading ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={18} />
            <Typography variant="body2">Loading saved notes...</Typography>
          </Stack>
        ) : null}
        {!loading && notes.length === 0 ? (
          <Alert severity="info">No notes saved yet. Create one here and it will persist locally in Postgres.</Alert>
        ) : null}
        <Stack spacing={1.25}>
          {notes.map((note) => (
            <WorkspaceNoteRow key={note.id} note={note} />
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
})

const WorkspaceNoteRow = observer(function WorkspaceNoteRow({ note }: { note: WorkspaceNote }) {
  const appStore = useAppStore()
  const editDraft = appStore.editDrafts.get(note.id)
  const updating = appStore.isUpdatingNote(note.id)
  const deleting = appStore.isDeletingNote(note.id)
  const editMessage = editDraft?.message ?? ''
  const editRemaining = 280 - editMessage.length
  const saveDisabled = updating || deleting || !editMessage.trim() || editMessage.length > 280

  if (editDraft) {
    return (
      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
        <Stack spacing={1.25}>
          <TextField
            label="Message"
            multiline
            minRows={2}
            value={editDraft.message}
            onChange={(event) => appStore.setNoteEditDraft(note.id, 'message', event.target.value)}
            error={editDraft.message.length > 280}
            helperText={`${editRemaining} characters remaining`}
          />
          <TextField
            label="Created by"
            value={editDraft.createdBy ?? ''}
            slotProps={{ htmlInput: { maxLength: 120 } }}
            onChange={(event) => appStore.setNoteEditDraft(note.id, 'createdBy', event.target.value)}
          />
          <TextField
            select
            label="Persona"
            value={editDraft.persona ?? 'unknown'}
            onChange={(event) => appStore.setNoteEditDraft(note.id, 'persona', event.target.value)}
          >
            <MenuItem value="unknown">unknown</MenuItem>
            {personas.map((persona) => (
              <MenuItem key={persona} value={persona}>
                {persona}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<CancelRounded />}
              disabled={updating}
              onClick={() => appStore.cancelEditingNote(note.id)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<CheckRounded />}
              disabled={saveDisabled}
              onClick={() => void appStore.updateNote(note.id)}
            >
              {updating ? 'Saving...' : 'Save changes'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography>{note.message}</Typography>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Edit note">
              <span>
                <IconButton
                  size="small"
                  aria-label={`Edit note ${note.id}`}
                  disabled={deleting}
                  onClick={() => appStore.startEditingNote(note)}
                >
                  <EditRounded fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete note">
              <span>
                <IconButton
                  size="small"
                  aria-label={`Delete note ${note.id}`}
                  color="error"
                  disabled={deleting}
                  onClick={() => void appStore.deleteNote(note.id)}
                >
                  {deleting ? <CircularProgress size={16} /> : <DeleteRounded fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip size="small" label={note.createdBy} icon={<PersonRounded />} />
          <Chip size="small" label={note.persona} color="secondary" variant="outlined" />
          <Typography variant="caption" color="text.secondary">
            {formatIsoDate(note.createdAt)}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  )
})

function PermissionPanel({ permissions }: { permissions: string[] }) {
  return (
    <Paper sx={surfaceSx}>
      <Stack spacing={2}>
        <SectionHeading eyebrow="Access" title="Resolved permissions" compact />
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {permissions.map((permission) => (
            <Chip key={permission} label={permission} variant="outlined" />
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}

function GuardedEmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <Paper sx={surfaceSx}>
      <Stack spacing={1.25}>
        <Typography variant="overline" color="secondary.main">
          Guarded view
        </Typography>
        <Typography variant="h5">{title}</Typography>
        <Typography color="text.secondary">{copy}</Typography>
      </Stack>
    </Paper>
  )
}

function SectionHeading({
  compact = false,
  copy,
  eyebrow,
  title,
}: {
  compact?: boolean
  copy?: string
  eyebrow: string
  title: string
}) {
  return (
    <Stack spacing={compact ? 0.5 : 0.75}>
      <Typography variant="overline" color="secondary.main">
        {eyebrow}
      </Typography>
      <Typography variant={compact ? 'h6' : 'h4'}>{title}</Typography>
      {copy ? (
        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {copy}
        </Typography>
      ) : null}
    </Stack>
  )
}

function FeatureCard({
  copy,
  eyebrow,
  footer,
  title,
}: {
  copy: string
  eyebrow: string
  footer?: ReactNode
  title: string
}) {
  return (
    <Paper sx={surfaceSx}>
      <Stack spacing={1.25}>
        <Typography variant="overline" color="secondary.main">
          {eyebrow}
        </Typography>
        <Typography variant="h6">{title}</Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {copy}
        </Typography>
        {footer}
      </Stack>
    </Paper>
  )
}

function ListRow({
  detail,
  meta,
  subtitle,
  title,
}: {
  detail?: string
  meta: string[]
  subtitle: string
  title: string
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
        }}
      >
        <Stack spacing={0.5}>
          <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
          {detail ? (
            <Typography variant="body2" color="text.secondary">
              {detail}
            </Typography>
          ) : null}
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {meta.map((value) => (
            <Chip key={value} label={value} variant="outlined" />
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}

function StatusPill({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Paper
      sx={{
        px: 1.5,
        py: 1.25,
        borderRadius: 4,
        minWidth: 118,
        backgroundColor: alpha('#fff', 0.74),
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {icon}
        <Box>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

function formatIsoDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default App
