import { waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppStore } from './app-store'
import type { DevState, Persona, WorkspaceNote } from './types'

describe('AppStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads state on persona changes', async () => {
    const fetchMock = mockFetch()
    const store = new AppStore()

    await waitFor(() => expect(store.state?.persona).toBe('user'))

    store.setPersona('admin')

    await waitFor(() => expect(store.state?.persona).toBe('admin'))
    expect(fetchMock).toHaveBeenCalledWith('/api/dev-state?persona=user')
    expect(fetchMock).toHaveBeenCalledWith('/api/dev-state?persona=admin')

    store.dispose()
  })

  it('creates notes and clears draft only after success', async () => {
    mockFetch({
      postNote: { id: 1, message: 'Saved note', createdBy: 'Ada', persona: 'user', createdAt: '2026-05-01T08:00:00Z' },
    })
    const store = new AppStore()

    await waitFor(() => expect(store.notesLoading).toBe(false))
    store.setNoteDraft('Saved note')
    await store.createNote()

    expect(store.noteDraft).toBe('')
    expect(store.notes[0]?.message).toBe('Saved note')

    store.dispose()
  })

  it('preserves draft and surfaces error on failed create', async () => {
    mockFetch({ failPost: true })
    const store = new AppStore()

    await waitFor(() => expect(store.notesLoading).toBe(false))
    store.setNoteDraft('Keep me')
    await store.createNote()

    expect(store.noteDraft).toBe('Keep me')
    expect(store.notesError).toBe('Message is required.')

    store.dispose()
  })

  it('updates and deletes notes after successful API calls', async () => {
    mockFetch({
      updateNote: { id: 1, message: 'Updated', createdBy: 'Ada', persona: 'admin', createdAt: '2026-05-01T08:00:00Z' },
    })
    const store = new AppStore()

    await waitFor(() => expect(store.notesLoading).toBe(false))
    store.notes = [{ id: 1, message: 'Old', createdBy: 'Ada', persona: 'user', createdAt: '2026-05-01T08:00:00Z' }]
    store.startEditingNote(store.notes[0])
    store.setNoteEditDraft(1, 'message', 'Updated')
    store.setNoteEditDraft(1, 'persona', 'admin')

    await store.updateNote(1)

    expect(store.notes[0]?.message).toBe('Updated')
    expect(store.notes[0]?.persona).toBe('admin')
    expect(store.editDrafts.has(1)).toBe(false)

    await store.deleteNote(1)

    expect(store.notes).toEqual([])

    store.dispose()
  })
})

function mockFetch(options: { postNote?: WorkspaceNote; updateNote?: WorkspaceNote; failPost?: boolean } = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)

    if (url.startsWith('/api/dev-state')) {
      const persona = new URLSearchParams(url.split('?')[1]).get('persona') as Persona
      return jsonResponse(createDevState(persona))
    }

    if (url === '/api/notes' && init?.method === 'POST') {
      if (options.failPost) {
        return jsonResponse({ errors: { message: ['Message is required.'] } }, 400)
      }

      return jsonResponse(options.postNote ?? { id: 1, message: 'Saved', createdBy: 'Ada', persona: 'user', createdAt: '2026-05-01T08:00:00Z' }, 201)
    }

    if (url === '/api/notes/1' && init?.method === 'PUT') {
      return jsonResponse(options.updateNote ?? { id: 1, message: 'Updated', createdBy: 'Ada', persona: 'admin', createdAt: '2026-05-01T08:00:00Z' })
    }

    if (url === '/api/notes/1' && init?.method === 'DELETE') {
      return new Response(null, { status: 204 })
    }

    if (url === '/api/notes') {
      return jsonResponse([])
    }

    throw new Error(`Unhandled request: ${url}`)
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function createDevState(persona: Persona): DevState {
  return {
    persona,
    session: {
      status: persona === 'anonymous' ? 'anonymous' : 'authenticated',
      user:
        persona === 'anonymous'
          ? null
          : {
              id: 'user-1',
              username: 'ada',
              displayName: 'Ada Lovelace',
              email: 'ada@example.test',
              title: 'Developer',
              bio: 'Builds starters.',
              locale: 'en-US',
              timezone: 'UTC',
              roles: [persona],
              permissions: ['notes:write'],
            },
      error: null,
    },
    navigation: [{ key: 'workspace', label: 'Workspace', items: [{ key: 'overview', href: '/overview', label: 'Overview', description: 'Overview' }] }],
    settingsSections: [],
    notifications: null,
    metrics: [],
    activity: [],
    followers: [],
    teamMembers: [],
    admin: null,
  }
}
