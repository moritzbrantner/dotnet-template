import { CssBaseline, ThemeProvider } from '@mui/material'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { AppStore, AppStoreContext } from './app-store'
import { createDevState } from './test/dev-state'
import { appTheme } from './theme'
import type { Persona } from './types'

describe('Workspace notes UI', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('disables save for blank and overlong drafts', async () => {
    const { store } = renderApp()

    const saveButton = await screen.findByRole('button', { name: /save to postgres/i })
    expect(saveButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/new note/i), { target: { value: stringValue(281) } })

    expect(saveButton).toBeDisabled()
    store.dispose()
  })

  it('renders validation errors', async () => {
    const user = userEvent.setup()
    const { store } = renderApp({ failPost: true })

    await user.type(await screen.findByLabelText(/new note/i), 'hello')
    await user.click(screen.getByRole('button', { name: /save to postgres/i }))

    await screen.findByText(/notes request failed: message is required\./i)
    store.dispose()
  })
})

function renderApp(options: { failPost?: boolean } = {}) {
  mockFetch(options)
  const store = new AppStore()

  const rendered = render(
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AppStoreContext.Provider value={store}>
        <App />
      </AppStoreContext.Provider>
    </ThemeProvider>,
  )

  return { store, ...rendered }
}

function mockFetch(options: { failPost?: boolean }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.startsWith('/api/dev-state')) {
        const persona = new URLSearchParams(url.split('?')[1]).get('persona') as Persona
        return jsonResponse(createDevState(persona))
      }

      if (url === '/api/notes' && init?.method === 'POST') {
        if (options.failPost) {
          return jsonResponse({ errors: { message: ['Message is required.'] } }, 400)
        }

        return jsonResponse(
          { id: 1, message: 'hello', createdBy: 'Ada Lovelace', persona: 'user', createdAt: '2026-05-01T08:00:00Z' },
          201,
        )
      }

      if (url === '/api/notes') {
        return jsonResponse([])
      }

      throw new Error(`Unhandled request: ${url}`)
    }),
  )
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function stringValue(length: number) {
  return 'a'.repeat(length)
}
