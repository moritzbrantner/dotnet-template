import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import App from './App'
import { AppStore, AppStoreContext } from './app-store'
import { createDevState } from './test/dev-state'
import type { Persona, WorkspaceNote } from './types'

const meta = {
  title: 'App/Orbit Console',
  component: App,
  render: () => <MockedApp />,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof App>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

function MockedApp() {
  installMockFetch()
  const [store] = useState(() => new AppStore())

  useEffect(() => () => store.dispose(), [store])

  return (
    <AppStoreContext.Provider value={store}>
      <App />
    </AppStoreContext.Provider>
  )
}

function installMockFetch() {
  const notes: WorkspaceNote[] = [
    {
      id: 1,
      message: 'Review the colocated Storybook story.',
      createdBy: 'Ada Lovelace',
      persona: 'user',
      createdAt: '2026-05-01T08:00:00Z',
    },
  ]

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl = new URL(String(input), window.location.origin)

    if (requestUrl.pathname === '/api/dev-state') {
      const persona = (requestUrl.searchParams.get('persona') ?? 'user') as Persona

      return jsonResponse(createDevState(persona))
    }

    if (requestUrl.pathname === '/api/notes' && init?.method === 'POST') {
      const request = JSON.parse(String(init.body)) as { message: string; createdBy?: string; persona?: string }
      const note = {
        id: notes.length + 1,
        message: request.message,
        createdBy: request.createdBy ?? 'Ada Lovelace',
        persona: request.persona ?? 'user',
        createdAt: '2026-05-01T08:00:00Z',
      }

      notes.unshift(note)
      return jsonResponse(note, 201)
    }

    if (requestUrl.pathname === '/api/notes') {
      return jsonResponse(notes)
    }

    return jsonResponse({ title: 'Unhandled mock request' }, 404)
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
