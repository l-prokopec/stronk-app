import type { AppState, ExerciseSetsByPerson, ExerciseTemplate, PersonSet, Workout, WorkoutCreationMode } from '../types/workout'
import { toLocalDate } from '../utils/date'
import { createId } from '../utils/id'

export const createPersonSet = (previous?: Pick<PersonSet, 'reps' | 'weight'>): PersonSet => ({ id: createId(), reps: previous?.reps ?? '', weight: previous?.weight ?? '' })
export const createInitialSetsByPerson = (): ExerciseSetsByPerson => ({ lukas: [createPersonSet()], terka: [createPersonSet()] })

export const createWorkout = (state: AppState, mode: WorkoutCreationMode = 'withTemplates', currentDate = new Date(), workoutId = createId()): Workout => {
  const timestamp = currentDate.toISOString()
  const templates = mode === 'withTemplates'
    ? [...state.exerciseTemplates].filter((item) => item.enabledByDefault).sort((a, b) => a.order - b.order)
    : []
  return {
    id: workoutId, date: toLocalDate(currentDate), createdAt: timestamp, updatedAt: timestamp,
    exercises: templates.map((template, order) => ({ id: createId(), exerciseTemplateId: template.id, name: template.name, order, setsByPerson: createInitialSetsByPerson() })),
  }
}

export const sortWorkoutsNewestFirst = (workouts: Workout[]): Workout[] =>
  [...workouts].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

export const createTemplate = (name: string, order: number): ExerciseTemplate => {
  const timestamp = new Date().toISOString()
  return { id: createId(), name, order, enabledByDefault: true, createdAt: timestamp, updatedAt: timestamp }
}
