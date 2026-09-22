import type { AppState, ExerciseTemplate, PersonProfile, PersonSet, Workout, WorkoutExercise } from '../types/workout'
import { createId } from '../utils/id'

export const STORAGE_KEY = 'gym-workout-tracker:v1'
export const CORRUPT_STORAGE_PREFIX = `${STORAGE_KEY}:corrupt:`
export const MIGRATION_BACKUP_PREFIX = `${STORAGE_KEY}:backup:v1:`
const DEFAULT_NAMES = ['Kliky', 'Dead bug', 'Boční plank', 'Plank', 'Bulhaři', 'Rumuni', 'Předkopávání', 'Zakopávání', 'Leg press', 'Výpony na lýtka', 'Asistované shyby', 'Asistované dipy']
const DEFAULT_PEOPLE: PersonProfile[] = [{ id: 'lukas', name: 'Lukáš', color: '#63cdbb' }, { id: 'terka', name: 'Terka', color: '#f08aaa' }]

export const createInitialState = (): AppState => {
  const timestamp = new Date().toISOString()
  return { version: 3, people: DEFAULT_PEOPLE, workouts: [], activeWorkoutId: null, exerciseTemplates: DEFAULT_NAMES.map((name, order): ExerciseTemplate => ({ id: createId(), name, order, enabledByDefault: true, createdAt: timestamp, updatedAt: timestamp })) }
}
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isTemplate = (value: unknown): value is ExerciseTemplate => isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.enabledByDefault === 'boolean' && typeof value.order === 'number'
const isPerson = (value: unknown): value is PersonProfile => isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.color === 'string'
const isPersonSet = (value: unknown): value is PersonSet => isRecord(value) && typeof value.id === 'string' && typeof value.reps === 'string' && typeof value.weight === 'string'
const isExercise = (value: unknown): value is WorkoutExercise => isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.order === 'number' && isRecord(value.setsByPerson) && Object.values(value.setsByPerson).every((sets) => Array.isArray(sets) && sets.every(isPersonSet))
const isWorkout = (value: unknown): value is Workout => isRecord(value) && typeof value.id === 'string' && typeof value.date === 'string' && typeof value.createdAt === 'string' && typeof value.updatedAt === 'string' && Array.isArray(value.people) && value.people.every(isPerson) && Array.isArray(value.exercises) && value.exercises.every(isExercise)
export const isAppState = (value: unknown): value is AppState => isRecord(value) && value.version === 3 && Array.isArray(value.people) && value.people.every(isPerson) && Array.isArray(value.exerciseTemplates) && value.exerciseTemplates.every(isTemplate) && Array.isArray(value.workouts) && value.workouts.every(isWorkout) && (value.activeWorkoutId === null || typeof value.activeWorkoutId === 'string')
type V2State = Omit<AppState, 'version' | 'people' | 'workouts'> & { version: 2; workouts: Array<Omit<Workout, 'people'>> }
type LegacyPersonData = { weight: string; reps: string }
type LegacySet = { id: string; lukas: LegacyPersonData; terka: LegacyPersonData }
type LegacyExercise = Omit<WorkoutExercise, 'setsByPerson'> & { sets: LegacySet[] }
type LegacyWorkout = Omit<Workout, 'people' | 'exercises'> & { exercises: LegacyExercise[] }
export type LegacyAppState = { version: 1; activeWorkoutId: string | null; exerciseTemplates: ExerciseTemplate[]; workouts: LegacyWorkout[] }
export const migrateV1State = (legacy: LegacyAppState): V2State => ({ ...legacy, version: 2, workouts: legacy.workouts.map((workout) => ({ ...workout, exercises: workout.exercises.map(({ sets, ...exercise }) => ({ ...exercise, setsByPerson: { lukas: sets.map((set) => ({ id: createId(), ...set.lukas })), terka: sets.map((set) => ({ id: createId(), ...set.terka })) } })) })) })
const isV2State = (value: unknown): value is V2State => isRecord(value) && value.version === 2 && Array.isArray(value.exerciseTemplates) && value.exerciseTemplates.every(isTemplate) && Array.isArray(value.workouts)
const isLegacyState = (value: unknown): value is LegacyAppState => isRecord(value) && value.version === 1 && Array.isArray(value.exerciseTemplates) && Array.isArray(value.workouts)
const migrateV2State = (state: V2State): AppState => ({ ...state, version: 3, people: DEFAULT_PEOPLE, workouts: state.workouts.map((workout) => ({ ...workout, people: DEFAULT_PEOPLE })) })
export const loadState = (storage: Storage = localStorage): AppState => {
  const raw = storage.getItem(STORAGE_KEY); if (raw === null) return createInitialState()
  try { const parsed: unknown = JSON.parse(raw); if (isAppState(parsed)) return parsed; if (isV2State(parsed) || isLegacyState(parsed)) { try { storage.setItem(`${MIGRATION_BACKUP_PREFIX}${Date.now()}`, raw) } catch { /* best effort */ } const migrated = migrateV2State(isLegacyState(parsed) ? migrateV1State(parsed) : parsed); try { storage.setItem(STORAGE_KEY, JSON.stringify(migrated)) } catch { /* provider retries */ } return migrated }; throw new Error('invalid') }
  catch { try { storage.setItem(`${CORRUPT_STORAGE_PREFIX}${Date.now()}`, raw) } catch { /* recovery first */ } return createInitialState() }
}
export const saveState = (state: AppState, storage: Storage = localStorage): boolean => { try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true } catch { return false } }
