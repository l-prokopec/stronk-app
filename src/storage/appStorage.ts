import type { AppState, ExerciseTemplate, PersonSet, Workout, WorkoutExercise, WorkoutTemplate } from '../types/workout'
import { createId } from '../utils/id'

export const STORAGE_KEY = 'gym-workout-tracker:v1'
export const CORRUPT_STORAGE_PREFIX = `${STORAGE_KEY}:corrupt:`
export const MIGRATION_BACKUP_PREFIX = `${STORAGE_KEY}:backup:v1:`
const DEFAULT_NAMES = ['Kliky', 'Dead bug', 'Boční plank', 'Plank', 'Bulhaři', 'Rumuni', 'Předkopávání', 'Zakopávání', 'Leg press', 'Výpony na lýtka', 'Asistované shyby', 'Asistované dipy']

type LegacyPersonData = { weight: string; reps: string }
type LegacySet = { id: string; lukas: LegacyPersonData; terka: LegacyPersonData }
type LegacyExercise = Omit<WorkoutExercise, 'setsByPerson'> & { sets: LegacySet[] }
type V4Workout = Omit<Workout, 'name'>
type V3Workout = Omit<V4Workout, 'sourceTemplateName'>
type LegacyWorkout = Omit<V3Workout, 'exercises'> & { exercises: LegacyExercise[] }
type V2State = { version: 2; exerciseTemplates: ExerciseTemplate[]; workouts: V3Workout[]; activeWorkoutId: string | null }
type V3State = { version: 3; workoutTemplates: WorkoutTemplate[]; workouts: V3Workout[]; activeWorkoutId: string | null }
type V4State = { version: 4; workoutTemplates: WorkoutTemplate[]; workouts: V4Workout[]; activeWorkoutId: string | null }
export type LegacyAppState = Omit<V2State, 'version' | 'workouts'> & { version: 1; workouts: LegacyWorkout[] }

export const createInitialState = (): AppState => {
  const timestamp = new Date().toISOString()
  return { version: 5, workouts: [], activeWorkoutId: null,
    workoutTemplates: [{ id: createId(), name: 'Výchozí trénink', createdAt: timestamp, updatedAt: timestamp,
      exercises: DEFAULT_NAMES.map((name, order): ExerciseTemplate => ({ id: createId(), name, order, enabledByDefault: true, createdAt: timestamp, updatedAt: timestamp })) }],
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isTemplate = (value: unknown): value is ExerciseTemplate => isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.enabledByDefault === 'boolean' && typeof value.order === 'number'
const isWorkoutTemplate = (value: unknown): value is WorkoutTemplate => isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.createdAt === 'string' && typeof value.updatedAt === 'string' && Array.isArray(value.exercises) && value.exercises.every(isTemplate)
const isPersonSet = (value: unknown): value is PersonSet => isRecord(value) && typeof value.id === 'string' && typeof value.reps === 'string' && typeof value.weight === 'string'
const isExercise = (value: unknown): value is WorkoutExercise => isRecord(value) && typeof value.id === 'string' && (value.exerciseTemplateId === null || typeof value.exerciseTemplateId === 'string') && typeof value.name === 'string' && typeof value.order === 'number' && (value.isCompleted === undefined || typeof value.isCompleted === 'boolean') && isRecord(value.setsByPerson) && Array.isArray(value.setsByPerson.lukas) && value.setsByPerson.lukas.every(isPersonSet) && Array.isArray(value.setsByPerson.terka) && value.setsByPerson.terka.every(isPersonSet)
const isWorkout = (value: unknown): value is Workout => isRecord(value) && typeof value.id === 'string' && typeof value.date === 'string' && typeof value.createdAt === 'string' && typeof value.updatedAt === 'string' && Array.isArray(value.exercises) && value.exercises.every(isExercise)
const hasWorkouts = (value: Record<string, unknown>) => Array.isArray(value.workouts) && value.workouts.every(isWorkout) && (value.activeWorkoutId === null || typeof value.activeWorkoutId === 'string')
const hasOldTemplates = (value: Record<string, unknown>) => Array.isArray(value.exerciseTemplates) && value.exerciseTemplates.every(isTemplate)
export const isAppState = (value: unknown): value is AppState => isRecord(value) && value.version === 5 && hasWorkouts(value) && Array.isArray(value.workouts) && value.workouts.every((workout: Record<string, unknown>) => typeof workout.sourceTemplateName === 'string' && typeof workout.name === 'string') && Array.isArray(value.workoutTemplates) && value.workoutTemplates.every(isWorkoutTemplate)
const isV4State = (value: unknown): value is V4State => isRecord(value) && value.version === 4 && hasWorkouts(value) && Array.isArray(value.workouts) && value.workouts.every((workout: Record<string, unknown>) => typeof workout.sourceTemplateName === 'string') && Array.isArray(value.workoutTemplates) && value.workoutTemplates.every(isWorkoutTemplate)
const isV3State = (value: unknown): value is V3State => isRecord(value) && value.version === 3 && hasWorkouts(value) && Array.isArray(value.workoutTemplates) && value.workoutTemplates.every(isWorkoutTemplate)
const isV2State = (value: unknown): value is V2State => isRecord(value) && value.version === 2 && hasWorkouts(value) && hasOldTemplates(value)

const isLegacyPersonData = (value: unknown): value is LegacyPersonData => isRecord(value) && typeof value.reps === 'string' && typeof value.weight === 'string'
const isLegacySet = (value: unknown): value is LegacySet => isRecord(value) && typeof value.id === 'string' && isLegacyPersonData(value.lukas) && isLegacyPersonData(value.terka)
const isLegacyExercise = (value: unknown): value is LegacyExercise => isRecord(value) && typeof value.id === 'string' && (value.exerciseTemplateId === null || typeof value.exerciseTemplateId === 'string') && typeof value.name === 'string' && typeof value.order === 'number' && Array.isArray(value.sets) && value.sets.every(isLegacySet)
const isLegacyWorkout = (value: unknown): value is LegacyWorkout => isRecord(value) && typeof value.id === 'string' && typeof value.date === 'string' && typeof value.createdAt === 'string' && typeof value.updatedAt === 'string' && Array.isArray(value.exercises) && value.exercises.every(isLegacyExercise)
export const isLegacyAppState = (value: unknown): value is LegacyAppState => isRecord(value) && value.version === 1 && hasOldTemplates(value) && Array.isArray(value.workouts) && value.workouts.every(isLegacyWorkout) && (value.activeWorkoutId === null || typeof value.activeWorkoutId === 'string')

export const migrateV1State = (legacy: LegacyAppState): V2State => ({
  ...legacy,
  version: 2,
  workouts: legacy.workouts.map((workout) => ({
    ...workout,
    exercises: workout.exercises.map(({ sets, ...exercise }) => ({
      ...exercise,
      isCompleted: false,
      setsByPerson: {
        lukas: sets.map((set) => ({ id: createId(), reps: set.lukas.reps, weight: set.lukas.weight })),
        terka: sets.map((set) => ({ id: createId(), reps: set.terka.reps, weight: set.terka.weight })),
      },
    })),
  })),
})

export const migrateV2State = (old: V2State): V3State => {
  const timestamp = new Date().toISOString()
  const template: WorkoutTemplate = { id: createId(), name: 'Výchozí trénink', exercises: old.exerciseTemplates, createdAt: timestamp, updatedAt: timestamp }
  return { version: 3, workoutTemplates: [template], activeWorkoutId: old.activeWorkoutId,
    workouts: old.workouts.map((workout) => ({ ...workout, sourceTemplateId: template.id })) }
}

export const migrateV3State = (old: V3State): V4State => ({
  ...old, version: 4,
  workouts: old.workouts.map((workout) => ({ ...workout,
    sourceTemplateName: old.workoutTemplates.find((item) => item.id === workout.sourceTemplateId)?.name
      ?? (workout.sourceTemplateId ? 'Smazaná šablona' : 'Prázdný trénink'),
  })),
})

export const migrateV4State = (old: V4State): AppState => ({
  ...old, version: 5,
  workouts: old.workouts.map((workout) => ({ ...workout, name: workout.sourceTemplateName })),
})

export const loadState = (storage: Storage = localStorage): AppState => {
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return createInitialState()
  try {
    const parsed: unknown = JSON.parse(raw)
    if (isAppState(parsed)) return parsed
    if (isV4State(parsed) || isV3State(parsed) || isV2State(parsed) || isLegacyAppState(parsed)) {
      let backupSaved = false
      try { storage.setItem(`${MIGRATION_BACKUP_PREFIX}${Date.now()}`, raw); backupSaved = true } catch { /* Původní hodnota zůstává pod hlavním klíčem. */ }
      const migrated = migrateV4State(isV4State(parsed) ? parsed : migrateV3State(isV3State(parsed) ? parsed : migrateV2State(isLegacyAppState(parsed) ? migrateV1State(parsed) : parsed)))
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
