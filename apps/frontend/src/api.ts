import type { DevState, Persona } from './types'

export async function loadDevState(persona: Persona) {
  const response = await fetch(`/api/dev-state?persona=${persona}`)

  if (!response.ok) {
    throw new Error(`Request returned ${response.status}`)
  }

  return (await response.json()) as DevState
}
