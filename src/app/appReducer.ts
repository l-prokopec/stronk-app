import { createEmptySet, createTemplate, createWorkout } from '../domain/workouts'
import type { AppState, Person, WorkoutCreationMode } from '../types/workout'
import { cleanExerciseName, normalizeExerciseName } from '../utils/exerciseName'
import { createId } from '../utils/id'

export type AppAction =
  | { type: 'CREATE_WORKOUT'; mode?: WorkoutCreationMode; now?: Date }
  | { type: 'OPEN_WORKOUT'; id: string }
  | { type: 'CLOSE_WORKOUT' }
  | { type: 'DELETE_WORKOUT'; id: string }
  | { type: 'UPDATE_DATE'; workoutId: string; date: string }
  | { type: 'ADD_EXERCISE'; workoutId: string; name: string; addToTemplates: boolean }
  | { type: 'REMOVE_EXERCISE'; workoutId: string; exerciseId: string }
  | { type: 'ADD_SET'; workoutId: string; exerciseId: string }
  | { type: 'REMOVE_SET'; workoutId: string; exerciseId: string; setId: string }
  | { type: 'UPDATE_SET'; workoutId: string; exerciseId: string; setId: string; person: Person; field: 'weight' | 'reps'; value: string }
  | { type: 'ADD_TEMPLATE'; name: string }
  | { type: 'RENAME_TEMPLATE'; id: string; name: string }
  | { type: 'TOGGLE_TEMPLATE'; id: string }
  | { type: 'DELETE_TEMPLATE'; id: string }
  | { type: 'MOVE_TEMPLATE'; id: string; direction: -1 | 1 }

const now = () => new Date().toISOString()
const updateWorkout = (state: AppState, id: string, transform: (workout: AppState['workouts'][number]) => AppState['workouts'][number]): AppState => ({
  ...state, workouts: state.workouts.map((workout) => workout.id === id ? { ...transform(workout), updatedAt: now() } : workout),
})

const normalizeOrders = (state: AppState): AppState => ({ ...state, exerciseTemplates: state.exerciseTemplates.map((template, order) => ({ ...template, order })) })

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'CREATE_WORKOUT': { const workout = createWorkout(state, action.mode, action.now); return { ...state, workouts: [...state.workouts, workout], activeWorkoutId: workout.id } }
    case 'OPEN_WORKOUT': return state.workouts.some((item) => item.id === action.id) ? { ...state, activeWorkoutId: action.id } : { ...state, activeWorkoutId: null }
    case 'CLOSE_WORKOUT': return { ...state, activeWorkoutId: null }
    case 'DELETE_WORKOUT': return { ...state, workouts: state.workouts.filter((item) => item.id !== action.id), activeWorkoutId: state.activeWorkoutId === action.id ? null : state.activeWorkoutId }
    case 'UPDATE_DATE': return updateWorkout(state, action.workoutId, (workout) => ({ ...workout, date: action.date }))
    case 'ADD_EXERCISE': {
      const name = cleanExerciseName(action.name)
      let next = updateWorkout(state, action.workoutId, (workout) => ({ ...workout, exercises: [...workout.exercises, { id: createId(), exerciseTemplateId: null, name, order: workout.exercises.length, sets: [createEmptySet()] }] }))
      if (action.addToTemplates) {
        const existing = next.exerciseTemplates.find((template) => normalizeExerciseName(template.name) === normalizeExerciseName(name))
        next = existing
          ? { ...next, exerciseTemplates: next.exerciseTemplates.map((template) => template.id === existing.id ? { ...template, enabledByDefault: true, updatedAt: now() } : template) }
          : { ...next, exerciseTemplates: [...next.exerciseTemplates, createTemplate(name, next.exerciseTemplates.length)] }
      }
      return next
    }
    case 'REMOVE_EXERCISE': return updateWorkout(state, action.workoutId, (workout) => ({ ...workout, exercises: workout.exercises.filter((item) => item.id !== action.exerciseId).map((item, order) => ({ ...item, order })) }))
    case 'ADD_SET': return updateWorkout(state, action.workoutId, (workout) => ({ ...workout, exercises: workout.exercises.map((exercise) => exercise.id === action.exerciseId ? { ...exercise, sets: [...exercise.sets, createEmptySet()] } : exercise) }))
    case 'REMOVE_SET': return updateWorkout(state, action.workoutId, (workout) => ({ ...workout, exercises: workout.exercises.map((exercise) => exercise.id === action.exerciseId && exercise.sets.length > 1 ? { ...exercise, sets: exercise.sets.filter((set) => set.id !== action.setId) } : exercise) }))
    case 'UPDATE_SET': return updateWorkout(state, action.workoutId, (workout) => ({ ...workout, exercises: workout.exercises.map((exercise) => exercise.id === action.exerciseId ? { ...exercise, sets: exercise.sets.map((set) => set.id === action.setId ? { ...set, [action.person]: { ...set[action.person], [action.field]: action.value } } : set) } : exercise) }))
    case 'ADD_TEMPLATE': return state.exerciseTemplates.some((item) => normalizeExerciseName(item.name) === normalizeExerciseName(action.name)) ? state : { ...state, exerciseTemplates: [...state.exerciseTemplates, createTemplate(cleanExerciseName(action.name), state.exerciseTemplates.length)] }
    case 'RENAME_TEMPLATE': return { ...state, exerciseTemplates: state.exerciseTemplates.map((item) => item.id === action.id ? { ...item, name: cleanExerciseName(action.name), updatedAt: now() } : item) }
    case 'TOGGLE_TEMPLATE': return { ...state, exerciseTemplates: state.exerciseTemplates.map((item) => item.id === action.id ? { ...item, enabledByDefault: !item.enabledByDefault, updatedAt: now() } : item) }
    case 'DELETE_TEMPLATE': return normalizeOrders({ ...state, exerciseTemplates: state.exerciseTemplates.filter((item) => item.id !== action.id) })
    case 'MOVE_TEMPLATE': {
      const sorted = [...state.exerciseTemplates].sort((a, b) => a.order - b.order)
      const index = sorted.findIndex((item) => item.id === action.id)
      const target = index + action.direction
      if (index < 0 || target < 0 || target >= sorted.length) return state
      ;[sorted[index], sorted[target]] = [sorted[target], sorted[index]]
      return { ...state, exerciseTemplates: sorted.map((item, order) => ({ ...item, order, updatedAt: item.id === action.id ? now() : item.updatedAt })) }
    }
  }
}
