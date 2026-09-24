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
  it('vytvoří stav verze 5 při prázdném localStorage', () => { expect(loadState().version).toBe(5); expect(loadState().workouts).toEqual([]) })
  it('počáteční stav obsahuje dvanáct aktivních výchozích cviků ve správném pořadí', () => {
    const state = createInitialState()
    expect(state.workoutTemplates).toHaveLength(1)
    expect(state.workoutTemplates[0].exercises.map(({ name }) => name)).toEqual(['Kliky', 'Dead bug', 'Boční plank', 'Plank', 'Bulhaři', 'Rumuni', 'Předkopávání', 'Zakopávání', 'Leg press', 'Výpony na lýtka', 'Asistované shyby', 'Asistované dipy'])
    expect(state.workoutTemplates[0].exercises.map(({ order }) => order)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(state.workoutTemplates[0].exercises.every((item) => item.enabledByDefault)).toBe(true)
  })
  it('načte uložený validní stav verze 5 beze změny', () => { const state = createInitialState(); state.activeWorkoutId = 'abc'; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); expect(loadState()).toEqual(state) })

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

  it('migraci provede pouze jednou a pod hlavní klíč uloží verzi 5', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyState()))
    expect(loadState().version).toBe(5)
    expect((JSON.parse(localStorage.getItem(STORAGE_KEY)!) as AppState).version).toBe(5)
    expect(loadState().version).toBe(5)
    expect(Object.keys(localStorage).filter((key) => key.startsWith(MIGRATION_BACKUP_PREFIX))).toHaveLength(1)
  })

  it('migruje verzi 2 včetně vypnutých cviků a historických tréninků', () => {
    const old = createInitialState()
    old.workoutTemplates[0].exercises[1].enabledByDefault = false
    const workout = { id: 'existing', date: '2026-07-14', createdAt: '2026-07-14T10:00:00Z', updatedAt: '2026-07-14T10:00:00Z', exercises: [{ id: 'exercise', exerciseTemplateId: old.workoutTemplates[0].exercises[0].id, name: 'Kliky', order: 0, setsByPerson: { lukas: [{ id: 'set-l', reps: '12', weight: '' }], terka: [{ id: 'set-t', reps: '8', weight: '' }] }, isCompleted: true }] }
    const raw = JSON.stringify({ version: 2, exerciseTemplates: old.workoutTemplates[0].exercises, workouts: [workout], activeWorkoutId: workout.id })
    localStorage.setItem(STORAGE_KEY, raw)
    const migrated = loadState()
    expect(migrated.workoutTemplates).toHaveLength(1)
    expect(migrated.workoutTemplates[0].exercises).toEqual(old.workoutTemplates[0].exercises)
    expect(migrated.workouts[0]).toMatchObject(workout)
    expect(migrated.workouts[0].sourceTemplateId).toBe(migrated.workoutTemplates[0].id)
    expect(migrated.workouts[0].sourceTemplateName).toBe('Výchozí trénink')
    expect(migrated.workouts[0].name).toBe('Výchozí trénink')
    expect(migrated.activeWorkoutId).toBe(workout.id)
    expect(localStorage.getItem(Object.keys(localStorage).find((key) => key.startsWith(MIGRATION_BACKUP_PREFIX))!)).toBe(raw)
  })

  it('migruje verzi 3 a doplní název šablony bez změny tréninku a sérií', () => {
    const state = createInitialState()
    const source = state.workoutTemplates[0]
    source.name = 'Full body'
    const workout = { id: 'old-workout', date: '2026-07-23', sourceTemplateId: source.id, createdAt: '2026-07-23T10:00:00Z', updatedAt: '2026-07-23T11:00:00Z', exercises: [{ id: 'old-exercise', exerciseTemplateId: source.exercises[0].id, name: 'Kliky', order: 0, isCompleted: true, setsByPerson: { lukas: [{ id: 'a', reps: '12', weight: '5' }], terka: [{ id: 'b', reps: '8', weight: '' }] } }] }
    const raw = JSON.stringify({ ...state, version: 3, workouts: [workout, { ...workout, id: 'empty', sourceTemplateId: null }, { ...workout, id: 'deleted', sourceTemplateId: 'deleted-template' }] })
    localStorage.setItem(STORAGE_KEY, raw)
    const migrated = loadState()
    expect(migrated.workouts.map((item) => item.sourceTemplateName)).toEqual(['Full body', 'Prázdný trénink', 'Smazaná šablona'])
    expect(migrated.workouts.map((item) => item.name)).toEqual(['Full body', 'Prázdný trénink', 'Smazaná šablona'])
    expect(migrated.workouts[0]).toMatchObject(workout)
    expect(migrated.workouts[0].exercises).toEqual(workout.exercises)
    expect(localStorage.getItem(Object.keys(localStorage).find((key) => key.startsWith(MIGRATION_BACKUP_PREFIX))!)).toBe(raw)
  })

  it('migruje verzi 4 na samostatný název tréninku a zachová zdroj i série', () => {
    const state = createInitialState()
    const workout = { id: 'old', date: '2026-07-23', sourceTemplateId: state.workoutTemplates[0].id, sourceTemplateName: 'Full body', createdAt: '2026-07-23T10:00:00Z', updatedAt: '2026-07-23T11:00:00Z', exercises: [{ id: 'exercise', exerciseTemplateId: null, name: 'Kliky', order: 0, setsByPerson: { lukas: [{ id: 'a', reps: '15', weight: '' }], terka: [] } }] }
    const raw = JSON.stringify({ ...state, version: 4, workouts: [workout] })
    localStorage.setItem(STORAGE_KEY, raw)
    const migrated = loadState()
    expect(migrated.workouts[0]).toEqual({ ...workout, name: 'Full body' })
    expect(loadState()).toEqual(migrated)
    expect(Object.keys(localStorage).filter((key) => key.startsWith(MIGRATION_BACKUP_PREFIX))).toHaveLength(1)
    expect(localStorage.getItem(Object.keys(localStorage).find((key) => key.startsWith(MIGRATION_BACKUP_PREFIX))!)).toBe(raw)
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
