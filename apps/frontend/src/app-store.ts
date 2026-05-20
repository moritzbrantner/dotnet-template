import { makeAutoObservable, reaction, runInAction } from 'mobx'
import { createContext, useContext } from 'react'
import { createWorkspaceNote, deleteWorkspaceNote, loadDevState, loadWorkspaceNotes, updateWorkspaceNote } from './api'
import type { DevState, NavigationCategory, NavigationItem, Persona, UpdateWorkspaceNoteRequest, WorkspaceNote } from './types'

export const personas: Persona[] = ['user', 'member', 'admin', 'anonymous', 'error']

export class AppStore {
  persona: Persona = 'user'
  state: DevState | null = null
  loading = true
  error: string | null = null
  currentPath = '/overview'
  notes: WorkspaceNote[] = []
  notesLoading = true
  notesError: string | null = null
  noteDraft = ''
  creatingNote = false
  editDrafts = new Map<number, UpdateWorkspaceNoteRequest>()
  updatingNoteIds = new Set<number>()
  deletingNoteIds = new Set<number>()

  private activeRequestId = 0
  private activeNotesRequestId = 0
  private readonly disposers: Array<() => void> = []

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })

    this.disposers.push(
      reaction(
        () => this.persona,
        () => {
          void this.loadState()
        },
        { fireImmediately: true },
      ),
      reaction(
        () => this.navigationSignature,
        () => {
          this.ensureCurrentPath()
        },
      ),
    )

    void this.loadNotes()
  }

  get navigation() {
    return this.state?.navigation ?? []
  }

  get selectedItem() {
    return this.state ? findNavigationItem(this.state.navigation, this.currentPath) : null
  }

  get notificationCount() {
    return this.state?.notifications?.unreadCount ?? 0
  }

  get isAuthenticated() {
    return this.state?.session.status === 'authenticated'
  }

  get sessionStatusLabel() {
    return formatSessionStatus(this.state?.session.status)
  }

  private get navigationSignature() {
    return this.navigation.flatMap((category) => category.items.map((item) => item.href)).join('|')
  }

  setPersona(nextPersona: Persona) {
    this.persona = nextPersona
  }

  setCurrentPath(path: string) {
    this.currentPath = path
  }

  setNoteDraft(value: string) {
    this.noteDraft = value
  }

  ensureCurrentPath() {
    if (this.state && !hasNavigationItem(this.state.navigation, this.currentPath)) {
      this.currentPath = getDefaultPath(this.state.navigation)
    }
  }

  async loadState() {
    const requestId = ++this.activeRequestId

    this.loading = true
    this.error = null

    try {
      const nextState = await loadDevState(this.persona)

      if (requestId !== this.activeRequestId) {
        return
      }

      runInAction(() => {
        this.state = nextState
        this.ensureCurrentPath()
      })
    } catch (caughtError: unknown) {
      if (requestId !== this.activeRequestId) {
        return
      }

      runInAction(() => {
        this.error = caughtError instanceof Error ? caughtError.message : 'Failed to load starter state.'
        this.state = null
      })
    } finally {
      if (requestId === this.activeRequestId) {
        runInAction(() => {
          this.loading = false
        })
      }
    }
  }

  async loadNotes() {
    const requestId = ++this.activeNotesRequestId

    this.notesLoading = true
    this.notesError = null

    try {
      const nextNotes = await loadWorkspaceNotes()

      if (requestId !== this.activeNotesRequestId) {
        return
      }

      runInAction(() => {
        this.notes = nextNotes
      })
    } catch (caughtError: unknown) {
      if (requestId !== this.activeNotesRequestId) {
        return
      }

      runInAction(() => {
        this.notesError = caughtError instanceof Error ? caughtError.message : 'Failed to load workspace notes.'
      })
    } finally {
      if (requestId === this.activeNotesRequestId) {
        runInAction(() => {
          this.notesLoading = false
        })
      }
    }
  }

  async createNote() {
    const message = this.noteDraft.trim()

    if (!message || this.noteDraft.length > 280) {
      return
    }

    this.creatingNote = true
    this.notesError = null

    try {
      const note = await createWorkspaceNote({
        message,
        createdBy: this.state?.session.user?.displayName ?? 'Local developer',
        persona: this.persona,
      })

      runInAction(() => {
        this.notes = [note, ...this.notes]
        this.noteDraft = ''
      })
    } catch (caughtError: unknown) {
      runInAction(() => {
        this.notesError = caughtError instanceof Error ? caughtError.message : 'Failed to save workspace note.'
      })
    } finally {
      runInAction(() => {
        this.creatingNote = false
      })
    }
  }

  startEditingNote(note: WorkspaceNote) {
    this.editDrafts.set(note.id, {
      message: note.message,
      createdBy: note.createdBy,
      persona: note.persona,
    })
  }

  cancelEditingNote(id: number) {
    this.editDrafts.delete(id)
  }

  setNoteEditDraft(id: number, field: keyof UpdateWorkspaceNoteRequest, value: string) {
    const current = this.editDrafts.get(id)

    if (!current) {
      return
    }

    this.editDrafts.set(id, {
      ...current,
      [field]: value,
    })
  }

  isUpdatingNote(id: number) {
    return this.updatingNoteIds.has(id)
  }

  isDeletingNote(id: number) {
    return this.deletingNoteIds.has(id)
  }

  async updateNote(id: number) {
    const draft = this.editDrafts.get(id)

    if (!draft || !draft.message.trim() || draft.message.length > 280) {
      return
    }

    this.updatingNoteIds.add(id)
    this.notesError = null

    try {
      const updatedNote = await updateWorkspaceNote(id, {
        ...draft,
        message: draft.message.trim(),
        createdBy: draft.createdBy?.trim(),
        persona: draft.persona?.trim(),
      })

      runInAction(() => {
        this.notes = this.notes.map((note) => (note.id === id ? updatedNote : note))
        this.editDrafts.delete(id)
      })
    } catch (caughtError: unknown) {
      runInAction(() => {
        this.notesError = caughtError instanceof Error ? caughtError.message : 'Failed to update workspace note.'
      })
    } finally {
      runInAction(() => {
        this.updatingNoteIds.delete(id)
      })
    }
  }

  async deleteNote(id: number) {
    this.deletingNoteIds.add(id)
    this.notesError = null

    try {
      await deleteWorkspaceNote(id)

      runInAction(() => {
        this.notes = this.notes.filter((note) => note.id !== id)
        this.editDrafts.delete(id)
      })
    } catch (caughtError: unknown) {
      runInAction(() => {
        this.notesError = caughtError instanceof Error ? caughtError.message : 'Failed to delete workspace note.'
      })
    } finally {
      runInAction(() => {
        this.deletingNoteIds.delete(id)
      })
    }
  }

  dispose() {
    for (const dispose of this.disposers) {
      dispose()
    }
  }
}

const AppStoreContext = createContext<AppStore | null>(null)

export function useAppStore() {
  const store = useContext(AppStoreContext)

  if (!store) {
    throw new Error('AppStoreProvider is missing.')
  }

  return store
}

export { AppStoreContext }

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
