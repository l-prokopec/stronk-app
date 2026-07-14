import type { AppState, ExerciseTemplate, Workout } from '../types/workout'
import { createId } from '../utils/id'

export const STORAGE_KEY = 'gym-workout-tracker:v1'
export const CORRUPT_STORAGE_PREFIX = `${STORAGE_KEY}:corrupt:`
const DEFAULT_NAMES = ['Leg press', 'Předkopávání', 'Zakopávání', 'Stahování horní kladky', 'Přítahy spodní kladky', 'Tlaky na prsa', 'Tlaky na ramena', 'Bicepsový zdvih', 'Triceps na kladce']

export const createInitialState = (): AppState => {
  const timestamp = new Date().toISOString()
  return { version: 1, workouts: [], activeWorkoutId: null,
    exerciseTemplates: DEFAULT_NAMES.map((name, order): ExerciseTemplate => ({ id: createId(), name, order, enabledByDefault: true, createdAt: timestamp, updatedAt: timestamp })),
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isWorkout = (value: unknown): value is Workout => isRecord(value) && typeof value.id === 'string' && typeof value.date === 'string' && Array.isArray(value.exercises)
const isTemplate = (value: unknown): value is ExerciseTemplate => isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.enabledByDefault === 'boolean' && typeof value.order === 'number'
export const isAppState = (value: unknown): value is AppState => isRecord(value) && value.version === 1 && Array.isArray(value.exerciseTemplates) && value.exerciseTemplates.every(isTemplate) && Array.isArray(value.workouts) && value.workouts.every(isWorkout) && (value.activeWorkoutId === null || typeof value.activeWorkoutId === 'string')

export const loadState = (storage: Storage = localStorage): AppState => {
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return createInitialState()
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isAppState(parsed)) throw new Error('Neplatná struktura uložených dat')
    return parsed
  } catch {
    try { storage.setItem(`${CORRUPT_STORAGE_PREFIX}${Date.now()}`, raw) } catch { /* Obnova aplikace má přednost před zálohou. */ }
    return createInitialState()
  }
}

export const saveState = (state: AppState, storage: Storage = localStorage): boolean => {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true } catch { return false }
}
