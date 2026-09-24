import { createInitialSetsByPerson, createPersonSet, createTemplate, createWorkout } from '../domain/workouts'
import type { AppState, Person, WorkoutTemplate } from '../types/workout'
import { cleanExerciseName, normalizeExerciseName } from '../utils/exerciseName'
import { createId } from '../utils/id'

export type AppAction =
  | { type: 'CREATE_WORKOUT'; templateId: string | null; now?: Date; id?: string }
  | { type: 'OPEN_WORKOUT'; id: string }
  | { type: 'CLOSE_WORKOUT' }
  | { type: 'DELETE_WORKOUT'; id: string }
  | { type: 'UPDATE_DATE'; workoutId: string; date: string }
  | { type: 'RENAME_WORKOUT'; workoutId: string; name: string }
  | { type: 'ADD_EXERCISE'; workoutId: string; name: string; targetTemplateId: string | null }
  | { type: 'REMOVE_EXERCISE'; workoutId: string; exerciseId: string }
  | { type: 'REORDER_EXERCISES'; workoutId: string; activeId: string; overId: string }
  | { type: 'ADD_PERSON_SET'; workoutId: string; exerciseId: string; person: Person }
  | { type: 'DELETE_PERSON_SET'; workoutId: string; exerciseId: string; person: Person; setId: string }
  | { type: 'UPDATE_PERSON_SET'; workoutId: string; exerciseId: string; person: Person; setId: string; field: 'weight' | 'reps'; value: string }
  | { type: 'COMPLETE_EXERCISE'; workoutId: string; exerciseId: string }
  | { type: 'REOPEN_EXERCISE'; workoutId: string; exerciseId: string }
  | { type: 'ADD_WORKOUT_TEMPLATE'; name: string }
  | { type: 'DUPLICATE_WORKOUT_TEMPLATE'; id: string; newId: string }
  | { type: 'RENAME_WORKOUT_TEMPLATE'; id: string; name: string }
  | { type: 'DELETE_WORKOUT_TEMPLATE'; id: string }
  | { type: 'ADD_TEMPLATE'; workoutTemplateId: string; name: string }
  | { type: 'RENAME_TEMPLATE'; workoutTemplateId: string; id: string; name: string }
  | { type: 'TOGGLE_TEMPLATE'; workoutTemplateId: string; id: string }
  | { type: 'DELETE_TEMPLATE'; workoutTemplateId: string; id: string }
  | { type: 'REORDER_TEMPLATES'; workoutTemplateId: string; activeId: string; overId: string }

const now = () => new Date().toISOString()
const updateWorkout = (state: AppState, id: string, transform: (workout: AppState['workouts'][number]) => AppState['workouts'][number]): AppState => ({
  ...state, workouts: state.workouts.map((workout) => workout.id === id ? { ...transform(workout), updatedAt: now() } : workout),
})

const updateTemplate = (state: AppState, id: string, transform: (template: WorkoutTemplate) => WorkoutTemplate): AppState => ({
  ...state, workoutTemplates: state.workoutTemplates.map((template) => template.id === id ? { ...transform(template), updatedAt: now() } : template),
})

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
    case 'CREATE_WORKOUT': { if (action.templateId !== null && !state.workoutTemplates.some((item) => item.id === action.templateId)) return state; const workout = createWorkout(state, action.templateId, action.now, action.id); return { ...state, workouts: [...state.workouts, workout], activeWorkoutId: workout.id } }
    case 'OPEN_WORKOUT': return state.workouts.some((item) => item.id === action.id) ? { ...state, activeWorkoutId: action.id } : { ...state, activeWorkoutId: null }
    case 'CLOSE_WORKOUT': return { ...state, activeWorkoutId: null }
    case 'DELETE_WORKOUT': return { ...state, workouts: state.workouts.filter((item) => item.id !== action.id), activeWorkoutId: state.activeWorkoutId === action.id ? null : state.activeWorkoutId }
    case 'UPDATE_DATE': return updateWorkout(state, action.workoutId, (workout) => ({ ...workout, date: action.date }))
    case 'RENAME_WORKOUT': {
      const name = cleanExerciseName(action.name)
      return name && name.length <= 80 ? updateWorkout(state, action.workoutId, (workout) => ({ ...workout, name })) : state
    }
    case 'ADD_EXERCISE': {
      const name = cleanExerciseName(action.name)
      let next = updateWorkout(state, action.workoutId, (workout) => ({ ...workout, exercises: [...workout.exercises, { id: createId(), exerciseTemplateId: null, name, order: workout.exercises.length, setsByPerson: createInitialSetsByPerson(), isCompleted: false }] }))
      if (action.targetTemplateId) next = updateTemplate(next, action.targetTemplateId, (template) => {
        const existing = template.exercises.find((item) => normalizeExerciseName(item.name) === normalizeExerciseName(name))
        return { ...template, exercises: existing
          ? template.exercises.map((item) => item.id === existing.id ? { ...item, enabledByDefault: true, updatedAt: now() } : item)
          : [...template.exercises, createTemplate(name, template.exercises.length)] }
      })
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
    case 'ADD_WORKOUT_TEMPLATE': {
      const name = cleanExerciseName(action.name)
      if (!name || state.workoutTemplates.some((item) => normalizeExerciseName(item.name) === normalizeExerciseName(name))) return state
      const timestamp = now()
      return { ...state, workoutTemplates: [...state.workoutTemplates, { id: createId(), name, exercises: [], createdAt: timestamp, updatedAt: timestamp }] }
    }
    case 'DUPLICATE_WORKOUT_TEMPLATE': {
      const source = state.workoutTemplates.find((item) => item.id === action.id)
      if (!source || state.workoutTemplates.some((item) => item.id === action.newId)) return state
      const copyName = (suffix: string) => `${source.name.slice(0, 80 - suffix.length).trimEnd()}${suffix}`
      let name = copyName(' (kopie)')
      let suffix = 2
      while (state.workoutTemplates.some((item) => normalizeExerciseName(item.name) === normalizeExerciseName(name))) name = copyName(` (kopie ${suffix++})`)
      const timestamp = now()
      return { ...state, workoutTemplates: [...state.workoutTemplates, { id: action.newId, name, createdAt: timestamp, updatedAt: timestamp,
        exercises: source.exercises.map((exercise) => ({ ...exercise, id: createId(), createdAt: timestamp, updatedAt: timestamp })) }] }
    }
    case 'RENAME_WORKOUT_TEMPLATE': {
      const name = cleanExerciseName(action.name)
      if (!name || state.workoutTemplates.some((item) => item.id !== action.id && normalizeExerciseName(item.name) === normalizeExerciseName(name))) return state
      return updateTemplate(state, action.id, (template) => ({ ...template, name }))
    }
    case 'DELETE_WORKOUT_TEMPLATE': return { ...state, workoutTemplates: state.workoutTemplates.filter((item) => item.id !== action.id) }
    case 'ADD_TEMPLATE': return updateTemplate(state, action.workoutTemplateId, (template) => template.exercises.some((item) => normalizeExerciseName(item.name) === normalizeExerciseName(action.name)) ? template : { ...template, exercises: [...template.exercises, createTemplate(cleanExerciseName(action.name), template.exercises.length)] })
    case 'RENAME_TEMPLATE': return updateTemplate(state, action.workoutTemplateId, (template) => ({ ...template, exercises: template.exercises.map((item) => item.id === action.id ? { ...item, name: cleanExerciseName(action.name), updatedAt: now() } : item) }))
    case 'TOGGLE_TEMPLATE': return updateTemplate(state, action.workoutTemplateId, (template) => ({ ...template, exercises: template.exercises.map((item) => item.id === action.id ? { ...item, enabledByDefault: !item.enabledByDefault, updatedAt: now() } : item) }))
    case 'DELETE_TEMPLATE': return updateTemplate(state, action.workoutTemplateId, (template) => ({ ...template, exercises: template.exercises.filter((item) => item.id !== action.id).map((item, order) => ({ ...item, order })) }))
    case 'REORDER_TEMPLATES': return updateTemplate(state, action.workoutTemplateId, (template) => {
      const sorted = [...template.exercises].sort((a, b) => a.order - b.order)
      const reordered = moveById(sorted, action.activeId, action.overId)
      return reordered === sorted ? template : { ...template, exercises: reordered.map((item, order) => ({ ...item, order, updatedAt: item.id === action.activeId ? now() : item.updatedAt })) }
    })
  }
}
