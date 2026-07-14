import { describe, expect, it } from 'vitest'
import { createInitialState } from '../storage/appStorage'
import { createWorkout, sortWorkoutsNewestFirst } from './workouts'

describe('vytvoření tréninku', () => {
  it('použije lokální datum', () => { expect(createWorkout(createInitialState(), new Date(2026, 6, 14, 23, 30)).date).toBe('2026-07-14') })
  it('vloží pouze aktivní cviky', () => { const state = createInitialState(); state.exerciseTemplates[1].enabledByDefault = false; const workout = createWorkout(state); expect(workout.exercises).toHaveLength(8); expect(workout.exercises.some((item) => item.name === 'Předkopávání')).toBe(false) })
  it('zachová pořadí šablon', () => { const state = createInitialState(); state.exerciseTemplates[0].order = 2; state.exerciseTemplates[2].order = 0; expect(createWorkout(state).exercises[0].name).toBe('Zakopávání') })
  it('každý cvik založí s jednou prázdnou sérií', () => { const workout = createWorkout(createInitialState()); expect(workout.exercises.every((item) => item.sets.length === 1 && item.sets[0].lukas.weight === '' && item.sets[0].terka.reps === '')).toBe(true) })
  it('řadí tréninky od nejnovějšího data', () => { const state = createInitialState(); const older = createWorkout(state, new Date(2026, 0, 1)); const newer = createWorkout(state, new Date(2026, 5, 1)); expect(sortWorkoutsNewestFirst([older, newer]).map((item) => item.id)).toEqual([newer.id, older.id]) })
})
