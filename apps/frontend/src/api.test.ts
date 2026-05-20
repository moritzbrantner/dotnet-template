import { afterEach, describe, expect, it, vi } from 'vitest'
import { createWorkspaceNote, deleteWorkspaceNote, updateWorkspaceNote } from './api'

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('throws parsed validation and problem messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            title: 'One or more validation errors occurred.',
            errors: {
              message: ['Message is required.'],
              persona: ['Persona must be one of: user, member.'],
            },
          },
          400,
        ),
      ),
    )

    await expect(createWorkspaceNote({ message: '', createdBy: 'Tester', persona: 'user' })).rejects.toThrow(
      'Message is required. Persona must be one of: user, member.',
    )
  })

  it('sends correct JSON for create, update, and delete', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: 1, message: 'new', createdBy: 'Tester', persona: 'user', createdAt: '2026-05-01T08:00:00Z' }, 201))
      .mockResolvedValueOnce(jsonResponse({ id: 1, message: 'updated', createdBy: 'Tester', persona: 'admin', createdAt: '2026-05-01T08:00:00Z' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await createWorkspaceNote({ message: 'new', createdBy: 'Tester', persona: 'user' })
    await updateWorkspaceNote(1, { message: 'updated', createdBy: 'Tester', persona: 'admin' })
    await deleteWorkspaceNote(1)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/notes',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'new', createdBy: 'Tester', persona: 'user' }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/notes/1',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'updated', createdBy: 'Tester', persona: 'admin' }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/notes/1', { method: 'DELETE' })
  })
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/problem+json',
    },
  })
}
