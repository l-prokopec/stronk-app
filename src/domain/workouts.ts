import type { AppState, ExerciseTemplate, Workout, WorkoutSet } from '../types/workout'
import { toLocalDate } from '../utils/date'
import { createId } from '../utils/id'

export const createEmptySet = (): WorkoutSet => ({ id: createId(), lukas: { weight: '', reps: '' }, terka: { weight: '', reps: '' } })

export const createWorkout = (state: AppState, now = new Date()): Workout => {
  const timestamp = now.toISOString()
  const templates = [...state.exerciseTemplates].filter((item) => item.enabledByDefault).sort((a, b) => a.order - b.order)
  return {
    id: createId(), date: toLocalDate(now), createdAt: timestamp, updatedAt: timestamp,
    exercises: templates.map((template, order) => ({ id: createId(), exerciseTemplateId: template.id, name: template.name, order, sets: [createEmptySet()] })),
  }
}

export const sortWorkoutsNewestFirst = (workouts: Workout[]): Workout[] =>
  [...workouts].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

export const createTemplate = (name: string, order: number): ExerciseTemplate => {
  const timestamp = new Date().toISOString()
  return { id: createId(), name, order, enabledByDefault: true, createdAt: timestamp, updatedAt: timestamp }
}
