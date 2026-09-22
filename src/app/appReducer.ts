import { createInitialSetsByPerson, createPersonSet, createTemplate, createWorkout } from '../domain/workouts'
import type { AppState, Person, WorkoutCreationMode } from '../types/workout'
import { cleanExerciseName, normalizeExerciseName } from '../utils/exerciseName'
import { createId } from '../utils/id'

export type AppAction =
  | { type: 'CREATE_WORKOUT'; mode?: WorkoutCreationMode; now?: Date; id?: string }
  | { type: 'OPEN_WORKOUT'; id: string }
  | { type: 'CLOSE_WORKOUT' }
  | { type: 'DELETE_WORKOUT'; id: string }
  | { type: 'UPDATE_DATE'; workoutId: string; date: string }
  | { type: 'ADD_EXERCISE'; workoutId: string; name: string; addToTemplates: boolean }
  | { type: 'REMOVE_EXERCISE'; workoutId: string; exerciseId: string }
  | { type: 'REORDER_EXERCISES'; workoutId: string; activeId: string; overId: string }
  | { type: 'ADD_PERSON_SET'; workoutId: string; exerciseId: string; person: Person }
  | { type: 'DELETE_PERSON_SET'; workoutId: string; exerciseId: string; person: Person; setId: string }
  | { type: 'UPDATE_PERSON_SET'; workoutId: string; exerciseId: string; person: Person; setId: string; field: 'weight' | 'reps'; value: string }
  | { type: 'COMPLETE_EXERCISE'; workoutId: string; exerciseId: string }
  | { type: 'REOPEN_EXERCISE'; workoutId: string; exerciseId: string }
  | { type: 'ADD_TEMPLATE'; name: string }
  | { type: 'RENAME_TEMPLATE'; id: string; name: string }
  | { type: 'TOGGLE_TEMPLATE'; id: string }
  | { type: 'DELETE_TEMPLATE'; id: string }
  | { type: 'REORDER_TEMPLATES'; activeId: string; overId: string }

const now = () => new Date().toISOString()
const updateWorkout = (state: AppState, id: string, transform: (workout: AppState['workouts'][number]) => AppState['workouts'][number]): AppState => ({
  ...state, workouts: state.workouts.map((workout) => workout.id === id ? { ...transform(workout), updatedAt: now() } : workout),
})

const normalizeOrders = (state: AppState): AppState => ({ ...state, exerciseTemplates: state.exerciseTemplates.map((template, order) => ({ ...template, order })) })

const moveById = <T extends { id: string }>(items: T[], activeId: string, overId: string): T[] => {
  const from = items.findIndex((item) => item.id === activeId)
  const to = items.findIndex((item) => item.id === overId)
  if (from < 0 || to < 0 || from === to) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'CREATE_WORKOUT': { const workout = createWorkout(state, action.mode, action.now, action.id); return { ...state, workouts: [...state.workouts, workout], activeWorkoutId: workout.id } }
    case 'OPEN_WORKOUT': return state.workouts.some((item) => item.id === action.id) ? { ...state, activeWorkoutId: action.id } : { ...state, activeWorkoutId: null }
    case 'CLOSE_WORKOUT': return { ...state, activeWorkoutId: null }
    case 'DELETE_WORKOUT': return { ...state, workouts: state.workouts.filter((item) => item.id !== action.id), activeWorkoutId: state.activeWorkoutId === action.id ? null : state.activeWorkoutId }
    case 'UPDATE_DATE': return updateWorkout(state, action.workoutId, (workout) => ({ ...workout, date: action.date }))
    case 'ADD_EXERCISE': {
      const name = cleanExerciseName(action.name)
      let next = updateWorkout(state, action.workoutId, (workout) => ({ ...workout, exercises: [...workout.exercises, { id: createId(), exerciseTemplateId: null, name, order: workout.exercises.length, setsByPerson: createInitialSetsByPerson(), isCompleted: false }] }))
      if (action.addToTemplates) {
        const existing = next.exerciseTemplates.find((template) => normalizeExerciseName(template.name) === normalizeExerciseName(name))
        next = existing
          ? { ...next, exerciseTemplates: next.exerciseTemplates.map((template) => template.id === existing.id ? { ...template, enabledByDefault: true, updatedAt: now() } : template) }
          : { ...next, exerciseTemplates: [...next.exerciseTemplates, createTemplate(name, next.exerciseTemplates.length)] }
      }
      return next
    }
    case 'REMOVE_EXERCISE': return updateWorkout(state, action.workoutId, (workout) => ({ ...workout, exercises: workout.exercises.filter((item) => item.id !== action.exerciseId).map((item, order) => ({ ...item, order })) }))
    case 'REORDER_EXERCISES': return updateWorkout(state, action.workoutId, (workout) => {
      const ordered = [...workout.exercises].sort((a, b) => a.order - b.order)
      const reordered = moveById(ordered, action.activeId, action.overId)
      if (reordered === ordered) return workout
      return { ...workout, exercises: reordered.map((exercise, order) => ({ ...exercise, order })) }
    })
    case 'ADD_PERSON_SET': return updateWorkout(state, action.workoutId, (workout) => ({ ...workout, exercises: workout.exercises.map((exercise) => {
      if (exercise.id !== action.exerciseId) return exercise
      const personSets = exercise.setsByPerson[action.person]
      return { ...exercise, setsByPerson: { ...exercise.setsByPerson, [action.person]: [...personSets, createPersonSet(personSets.at(-1))] } }
    }) }))
    case 'DELETE_PERSON_SET': return updateWorkout(state, action.workoutId, (workout) => ({ ...workout, exercises: workout.exercises.map((exercise) => exercise.id === action.exerciseId ? { ...exercise, setsByPerson: { ...exercise.setsByPerson, [action.person]: exercise.setsByPerson[action.person].filter((set) => set.id !== action.setId) } } : exercise) }))
    case 'UPDATE_PERSON_SET': return updateWorkout(state, action.workoutId, (workout) => ({ ...workout, exercises: workout.exercises.map((exercise) => exercise.id === action.exerciseId ? { ...exercise, setsByPerson: { ...exercise.setsByPerson, [action.person]: exercise.setsByPerson[action.person].map((set) => set.id === action.setId ? { ...set, [action.field]: action.value } : set) } } : exercise) }))
    case 'COMPLETE_EXERCISE': return updateWorkout(state, action.workoutId, (workout) => ({ ...workout, exercises: workout.exercises.map((exercise) => exercise.id === action.exerciseId ? { ...exercise, isCompleted: true } : exercise) }))
    case 'REOPEN_EXERCISE': return updateWorkout(state, action.workoutId, (workout) => ({ ...workout, exercises: workout.exercises.map((exercise) => exercise.id === action.exerciseId ? { ...exercise, isCompleted: false } : exercise) }))
    case 'ADD_TEMPLATE': return state.exerciseTemplates.some((item) => normalizeExerciseName(item.name) === normalizeExerciseName(action.name)) ? state : { ...state, exerciseTemplates: [...state.exerciseTemplates, createTemplate(cleanExerciseName(action.name), state.exerciseTemplates.length)] }
    case 'RENAME_TEMPLATE': return { ...state, exerciseTemplates: state.exerciseTemplates.map((item) => item.id === action.id ? { ...item, name: cleanExerciseName(action.name), updatedAt: now() } : item) }
    case 'TOGGLE_TEMPLATE': return { ...state, exerciseTemplates: state.exerciseTemplates.map((item) => item.id === action.id ? { ...item, enabledByDefault: !item.enabledByDefault, updatedAt: now() } : item) }
    case 'DELETE_TEMPLATE': return normalizeOrders({ ...state, exerciseTemplates: state.exerciseTemplates.filter((item) => item.id !== action.id) })
    case 'REORDER_TEMPLATES': {
      const sorted = [...state.exerciseTemplates].sort((a, b) => a.order - b.order)
      const reordered = moveById(sorted, action.activeId, action.overId)
      if (reordered === sorted) return state
      return { ...state, exerciseTemplates: reordered.map((item, order) => ({ ...item, order, updatedAt: item.id === action.activeId ? now() : item.updatedAt })) }
    }
  }
}
