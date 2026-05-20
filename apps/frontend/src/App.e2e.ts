import { expect, test } from '@playwright/test'
import { createDevState } from './test/dev-state'
import type { Persona, WorkspaceNote } from './types'

test.beforeEach(async ({ page }) => {
  const notes: WorkspaceNote[] = []

  await page.route('**/api/dev-state?**', async (route) => {
    const requestUrl = new URL(route.request().url())
    const persona = (requestUrl.searchParams.get('persona') ?? 'user') as Persona

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createDevState(persona)),
    })
  })

  await page.route('**/api/notes', async (route) => {
    if (route.request().method() === 'POST') {
      const request = route.request().postDataJSON() as { message: string; createdBy?: string; persona?: string }
      const note = {
        id: notes.length + 1,
        message: request.message,
        createdBy: request.createdBy ?? 'Ada Lovelace',
        persona: request.persona ?? 'user',
        createdAt: '2026-05-01T08:00:00Z',
      }

      notes.unshift(note)

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(note),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(notes),
    })
  })
})

test('loads the shell and saves a workspace note', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Orbit Console' })).toBeVisible()
  await expect(page.getByRole('button', { name: /save to postgres/i })).toBeDisabled()

  await page.getByLabel(/new note/i).fill('Ship colocated Playwright coverage')
  await page.getByRole('button', { name: /save to postgres/i }).click()

  await expect(page.getByText('Ship colocated Playwright coverage')).toBeVisible()
})
