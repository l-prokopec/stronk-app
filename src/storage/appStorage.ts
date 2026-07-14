import type { AppState, ExerciseTemplate, PersonSet, Workout, WorkoutExercise } from '../types/workout'
import { createId } from '../utils/id'

export const STORAGE_KEY = 'gym-workout-tracker:v1'
export const CORRUPT_STORAGE_PREFIX = `${STORAGE_KEY}:corrupt:`
export const MIGRATION_BACKUP_PREFIX = `${STORAGE_KEY}:backup:v1:`
const DEFAULT_NAMES = ['Leg press', 'Předkopávání', 'Zakopávání', 'Stahování horní kladky', 'Přítahy spodní kladky', 'Tlaky na prsa', 'Tlaky na ramena', 'Bicepsový zdvih', 'Triceps na kladce']

type LegacyPersonData = { weight: string; reps: string }
type LegacySet = { id: string; lukas: LegacyPersonData; terka: LegacyPersonData }
type LegacyExercise = Omit<WorkoutExercise, 'setsByPerson'> & { sets: LegacySet[] }
type LegacyWorkout = Omit<Workout, 'exercises'> & { exercises: LegacyExercise[] }
export type LegacyAppState = Omit<AppState, 'version' | 'workouts'> & { version: 1; workouts: LegacyWorkout[] }

export const createInitialState = (): AppState => {
  const timestamp = new Date().toISOString()
  return { version: 2, workouts: [], activeWorkoutId: null,
    exerciseTemplates: DEFAULT_NAMES.map((name, order): ExerciseTemplate => ({ id: createId(), name, order, enabledByDefault: true, createdAt: timestamp, updatedAt: timestamp })),
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isTemplate = (value: unknown): value is ExerciseTemplate => isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.enabledByDefault === 'boolean' && typeof value.order === 'number'
const isPersonSet = (value: unknown): value is PersonSet => isRecord(value) && typeof value.id === 'string' && typeof value.reps === 'string' && typeof value.weight === 'string'
const isExercise = (value: unknown): value is WorkoutExercise => isRecord(value) && typeof value.id === 'string' && (value.exerciseTemplateId === null || typeof value.exerciseTemplateId === 'string') && typeof value.name === 'string' && typeof value.order === 'number' && isRecord(value.setsByPerson) && Array.isArray(value.setsByPerson.lukas) && value.setsByPerson.lukas.every(isPersonSet) && Array.isArray(value.setsByPerson.terka) && value.setsByPerson.terka.every(isPersonSet)
const isWorkout = (value: unknown): value is Workout => isRecord(value) && typeof value.id === 'string' && typeof value.date === 'string' && typeof value.createdAt === 'string' && typeof value.updatedAt === 'string' && Array.isArray(value.exercises) && value.exercises.every(isExercise)
const hasStateShape = (value: Record<string, unknown>) => Array.isArray(value.exerciseTemplates) && value.exerciseTemplates.every(isTemplate) && Array.isArray(value.workouts) && (value.activeWorkoutId === null || typeof value.activeWorkoutId === 'string')
export const isAppState = (value: unknown): value is AppState => isRecord(value) && value.version === 2 && hasStateShape(value) && (value.workouts as unknown[]).every(isWorkout)

const isLegacyPersonData = (value: unknown): value is LegacyPersonData => isRecord(value) && typeof value.reps === 'string' && typeof value.weight === 'string'
const isLegacySet = (value: unknown): value is LegacySet => isRecord(value) && typeof value.id === 'string' && isLegacyPersonData(value.lukas) && isLegacyPersonData(value.terka)
const isLegacyExercise = (value: unknown): value is LegacyExercise => isRecord(value) && typeof value.id === 'string' && (value.exerciseTemplateId === null || typeof value.exerciseTemplateId === 'string') && typeof value.name === 'string' && typeof value.order === 'number' && Array.isArray(value.sets) && value.sets.every(isLegacySet)
const isLegacyWorkout = (value: unknown): value is LegacyWorkout => isRecord(value) && typeof value.id === 'string' && typeof value.date === 'string' && typeof value.createdAt === 'string' && typeof value.updatedAt === 'string' && Array.isArray(value.exercises) && value.exercises.every(isLegacyExercise)
export const isLegacyAppState = (value: unknown): value is LegacyAppState => isRecord(value) && value.version === 1 && hasStateShape(value) && (value.workouts as unknown[]).every(isLegacyWorkout)

export const migrateV1State = (legacy: LegacyAppState): AppState => ({
  ...legacy,
  version: 2,
  workouts: legacy.workouts.map((workout) => ({
    ...workout,
    exercises: workout.exercises.map(({ sets, ...exercise }) => ({
      ...exercise,
      setsByPerson: {
        lukas: sets.map((set) => ({ id: createId(), reps: set.lukas.reps, weight: set.lukas.weight })),
        terka: sets.map((set) => ({ id: createId(), reps: set.terka.reps, weight: set.terka.weight })),
      },
    })),
  })),
})

export const loadState = (storage: Storage = localStorage): AppState => {
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return createInitialState()
  try {
    const parsed: unknown = JSON.parse(raw)
    if (isAppState(parsed)) return parsed
    if (isLegacyAppState(parsed)) {
      let backupSaved = false
      try { storage.setItem(`${MIGRATION_BACKUP_PREFIX}${Date.now()}`, raw); backupSaved = true } catch { /* Původní hodnota zůstává pod hlavním klíčem. */ }
      const migrated = migrateV1State(parsed)
      if (backupSaved) try { storage.setItem(STORAGE_KEY, JSON.stringify(migrated)) } catch { /* AppProvider zkusí stav uložit znovu. */ }
      return migrated
    }
    throw new Error('Neplatná struktura uložených dat')
  } catch {
    try { storage.setItem(`${CORRUPT_STORAGE_PREFIX}${Date.now()}`, raw) } catch { /* Obnova aplikace má přednost před zálohou. */ }
    return createInitialState()
  }
}

export const saveState = (state: AppState, storage: Storage = localStorage): boolean => {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true } catch { return false }
}
