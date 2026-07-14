import { describe, expect, it, vi } from 'vitest'
import { CORRUPT_STORAGE_PREFIX, STORAGE_KEY, createInitialState, loadState, saveState } from './appStorage'

describe('appStorage', () => {
  it('vytvoří počáteční stav při prázdném localStorage', () => { expect(loadState().version).toBe(1); expect(loadState().workouts).toEqual([]) })
  it('počáteční stav obsahuje devět aktivních výchozích cviků', () => { const state = createInitialState(); expect(state.exerciseTemplates).toHaveLength(9); expect(state.exerciseTemplates.every((item) => item.enabledByDefault)).toBe(true) })
  it('načte uložený validní stav', () => { const state = createInitialState(); state.activeWorkoutId = 'abc'; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); expect(loadState().activeWorkoutId).toBe('abc') })
  it('poškozený JSON nespadne a vytvoří čistý stav', () => { localStorage.setItem(STORAGE_KEY, '{oops'); expect(loadState().workouts).toEqual([]) })
  it('zachová poškozenou hodnotu pod záložním klíčem', () => { localStorage.setItem(STORAGE_KEY, '{oops'); loadState(); const key = Object.keys(localStorage).find((item) => item.startsWith(CORRUPT_STORAGE_PREFIX)); expect(key).toBeDefined(); expect(localStorage.getItem(key!)).toBe('{oops') })
  it('vrátí false při selhání zápisu', () => { const storage = { setItem: vi.fn(() => { throw new Error('full') }) } as unknown as Storage; expect(saveState(createInitialState(), storage)).toBe(false) })
})
