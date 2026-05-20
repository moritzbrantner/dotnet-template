import type { CreateWorkspaceNoteRequest, DevState, Persona, UpdateWorkspaceNoteRequest, WorkspaceNote } from './types'

export async function loadDevState(persona: Persona) {
  const response = await fetch(`/api/dev-state?persona=${persona}`)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as DevState
}

export async function loadWorkspaceNotes() {
  const response = await fetch('/api/notes')

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as WorkspaceNote[]
}

export async function loadWorkspaceNote(id: number) {
  const response = await fetch(`/api/notes/${id}`)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as WorkspaceNote
}

export async function createWorkspaceNote(request: CreateWorkspaceNoteRequest) {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as WorkspaceNote
}

export async function updateWorkspaceNote(id: number, request: UpdateWorkspaceNoteRequest) {
  const response = await fetch(`/api/notes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as WorkspaceNote
}

export async function deleteWorkspaceNote(id: number) {
  const response = await fetch(`/api/notes/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
}

async function getErrorMessage(response: Response) {
  const fallback = `Request returned ${response.status}`
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('json')) {
    return fallback
  }

  try {
    const payload = (await response.json()) as {
      title?: string
      detail?: string
      errors?: Record<string, string[]>
    }
    const validationMessages = payload.errors ? Object.values(payload.errors).flat() : []

    if (validationMessages.length > 0) {
      return validationMessages.join(' ')
    }

    return payload.detail ?? payload.title ?? fallback
  } catch {
    return fallback
  }
}
