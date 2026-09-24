import type { AppState, ExerciseSetsByPerson, ExerciseTemplate, PersonSet, Workout } from '../types/workout'
import { toLocalDate } from '../utils/date'
import { createId } from '../utils/id'

export const createPersonSet = (previous?: Pick<PersonSet, 'reps' | 'weight'>): PersonSet => ({ id: createId(), reps: previous?.reps ?? '', weight: previous?.weight ?? '' })
export const createInitialSetsByPerson = (): ExerciseSetsByPerson => ({ lukas: [createPersonSet()], terka: [createPersonSet()] })

export const createWorkout = (state: AppState, templateId: string | null = state.workoutTemplates[0]?.id ?? null, currentDate = new Date(), workoutId = createId()): Workout => {
  const timestamp = currentDate.toISOString()
  const source = state.workoutTemplates.find((item) => item.id === templateId)
  const templates = [...(source?.exercises ?? [])].filter((item) => item.enabledByDefault).sort((a, b) => a.order - b.order)
  return {
    id: workoutId, date: toLocalDate(currentDate), sourceTemplateId: source?.id ?? null, sourceTemplateName: source?.name ?? 'Prázdný trénink', createdAt: timestamp, updatedAt: timestamp,
    exercises: templates.map((template, order) => ({ id: createId(), exerciseTemplateId: template.id, name: template.name, order, setsByPerson: createInitialSetsByPerson(), isCompleted: false })),
  }
}

export const sortWorkoutsNewestFirst = (workouts: Workout[]): Workout[] =>
  [...workouts].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

export const createTemplate = (name: string, order: number): ExerciseTemplate => {
  const timestamp = new Date().toISOString()
  return { id: createId(), name, order, enabledByDefault: true, createdAt: timestamp, updatedAt: timestamp }
}
