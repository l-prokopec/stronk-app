import { describe, expect, it, vi } from 'vitest'
import type { AppState } from '../types/workout'
import { CORRUPT_STORAGE_PREFIX, MIGRATION_BACKUP_PREFIX, STORAGE_KEY, createInitialState, loadState, migrateV1State, saveState, type LegacyAppState } from './appStorage'

const legacyState = (): LegacyAppState => ({
  version: 1,
  activeWorkoutId: 'workout-1',
  exerciseTemplates: [{ id: 'template-1', name: 'Leg press', order: 0, enabledByDefault: true, createdAt: '2025-01-01T10:00:00.000Z', updatedAt: '2025-01-02T10:00:00.000Z' }],
  workouts: [{
    id: 'workout-1',
    date: '2025-02-03',
    createdAt: '2025-02-03T10:00:00.000Z',
    updatedAt: '2025-02-03T11:00:00.000Z',
    exercises: [{
      id: 'exercise-1', exerciseTemplateId: 'template-1', name: 'Leg press', order: 0,
      sets: [
        { id: 'legacy-set-1', lukas: { reps: '10', weight: '100,5' }, terka: { reps: '12', weight: '40' } },
        { id: 'legacy-set-2', lukas: { reps: '8', weight: '110' }, terka: { reps: '9', weight: '45.5' } },
      ],
    }],
  }],
})

describe('appStorage', () => {
  it('vytvoří stav verze 2 při prázdném localStorage', () => { expect(loadState().version).toBe(2); expect(loadState().workouts).toEqual([]) })
  it('počáteční stav obsahuje devět aktivních výchozích cviků', () => { const state = createInitialState(); expect(state.exerciseTemplates).toHaveLength(9); expect(state.exerciseTemplates.every((item) => item.enabledByDefault)).toBe(true) })
  it('načte uložený validní stav verze 2 beze změny', () => { const state = createInitialState(); state.activeWorkoutId = 'abc'; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); expect(loadState()).toEqual(state) })

  it('migruje každou starou společnou sérii na jednu sérii pro každou osobu', () => {
    const migrated = migrateV1State(legacyState())
    const exercise = migrated.workouts[0].exercises[0]
    expect(migrated.version).toBe(2)
    expect(exercise.setsByPerson.lukas).toHaveLength(2)
    expect(exercise.setsByPerson.terka).toHaveLength(2)
  })

  it('při migraci zachová hodnoty a pořadí sérií', () => {
    const sets = migrateV1State(legacyState()).workouts[0].exercises[0].setsByPerson
    expect(sets.lukas.map(({ reps, weight }) => ({ reps, weight }))).toEqual([{ reps: '10', weight: '100,5' }, { reps: '8', weight: '110' }])
    expect(sets.terka.map(({ reps, weight }) => ({ reps, weight }))).toEqual([{ reps: '12', weight: '40' }, { reps: '9', weight: '45.5' }])
  })

  it('při migraci vytvoří každé osobní sérii nové unikátní ID', () => {
    const sets = migrateV1State(legacyState()).workouts[0].exercises[0].setsByPerson
    const ids = [...sets.lukas, ...sets.terka].map((set) => set.id)
    expect(new Set(ids).size).toBe(4)
    expect(ids).not.toContain('legacy-set-1')
    expect(ids).not.toContain('legacy-set-2')
  })

  it('při migraci zachová tréninky, cviky, datum, názvy a template vazby', () => {
    const legacy = legacyState()
    const migrated = migrateV1State(legacy)
    expect(migrated.activeWorkoutId).toBe('workout-1')
    expect(migrated.workouts[0]).toMatchObject({ id: 'workout-1', date: '2025-02-03', createdAt: legacy.workouts[0].createdAt, updatedAt: legacy.workouts[0].updatedAt })
    expect(migrated.workouts[0].exercises[0]).toMatchObject({ id: 'exercise-1', exerciseTemplateId: 'template-1', name: 'Leg press', order: 0 })
    expect(migrated.exerciseTemplates).toEqual(legacy.exerciseTemplates)
  })

  it('před migrací uloží přesnou původní hodnotu pod záložním klíčem', () => {
    const raw = JSON.stringify(legacyState())
    localStorage.setItem(STORAGE_KEY, raw)
    loadState()
    const backupKey = Object.keys(localStorage).find((key) => key.startsWith(MIGRATION_BACKUP_PREFIX))
    expect(backupKey).toBeDefined()
    expect(localStorage.getItem(backupKey!)).toBe(raw)
  })

  it('migraci provede pouze jednou a pod hlavní klíč uloží verzi 2', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyState()))
    expect(loadState().version).toBe(2)
    expect((JSON.parse(localStorage.getItem(STORAGE_KEY)!) as AppState).version).toBe(2)
    expect(loadState().version).toBe(2)
    expect(Object.keys(localStorage).filter((key) => key.startsWith(MIGRATION_BACKUP_PREFIX))).toHaveLength(1)
  })

  it('již migrovaný stav nemigruje ani nezálohuje', () => {
    const state = createInitialState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    expect(loadState()).toEqual(state)
    expect(Object.keys(localStorage).some((key) => key.startsWith(MIGRATION_BACKUP_PREFIX))).toBe(false)
  })

  it('poškozený JSON nespadne a vytvoří čistý stav', () => { localStorage.setItem(STORAGE_KEY, '{oops'); expect(loadState().workouts).toEqual([]) })
  it('neplatná struktura verze 1 nespadne a vytvoří čistý stav', () => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, workouts: 'oops' })); expect(loadState().workouts).toEqual([]) })
  it('zachová poškozenou hodnotu pod záložním klíčem', () => { localStorage.setItem(STORAGE_KEY, '{oops'); loadState(); const key = Object.keys(localStorage).find((item) => item.startsWith(CORRUPT_STORAGE_PREFIX)); expect(key).toBeDefined(); expect(localStorage.getItem(key!)).toBe('{oops') })
  it('vrátí false při selhání zápisu', () => { const storage = { setItem: vi.fn(() => { throw new Error('full') }) } as unknown as Storage; expect(saveState(createInitialState(), storage)).toBe(false) })
})
