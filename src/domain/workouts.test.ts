import { describe, expect, it } from 'vitest'
import { createInitialState } from '../storage/appStorage'
import { createPersonSet, createWorkout, sortWorkoutsNewestFirst } from './workouts'

describe('vytvoření tréninku', () => {
  it('použije lokální datum', () => { expect(createWorkout(createInitialState(), 'withTemplates', new Date(2026, 6, 14, 23, 30)).date).toBe('2026-07-14') })
  it('vloží pouze aktivní cviky', () => { const state = createInitialState(); state.exerciseTemplates[1].enabledByDefault = false; const workout = createWorkout(state); expect(workout.exercises).toHaveLength(8); expect(workout.exercises.some((item) => item.name === 'Předkopávání')).toBe(false) })
  it('zachová pořadí šablon', () => { const state = createInitialState(); state.exerciseTemplates[0].order = 2; state.exerciseTemplates[2].order = 0; expect(createWorkout(state).exercises[0].name).toBe('Zakopávání') })
  it('každý cvik založí s jednou prázdnou sérií pro každou osobu', () => { const workout = createWorkout(createInitialState()); expect(workout.exercises.every((item) => item.setsByPerson.lukas.length === 1 && item.setsByPerson.terka.length === 1 && item.setsByPerson.lukas[0].weight === '' && item.setsByPerson.terka[0].reps === '')).toBe(true) })
  it('počáteční série osob mají různá stabilní ID', () => { const exercise = createWorkout(createInitialState()).exercises[0]; expect(exercise.setsByPerson.lukas[0].id).not.toBe(exercise.setsByPerson.terka[0].id) })
  it('kopie série přebírá hodnoty, ale ne ID ani referenci', () => { const original = createPersonSet({ reps: '8', weight: '42,5' }); const copy = createPersonSet(original); expect(copy).toMatchObject({ reps: '8', weight: '42,5' }); expect(copy.id).not.toBe(original.id); expect(copy).not.toBe(original) })
  it('řadí tréninky od nejnovějšího data', () => { const state = createInitialState(); const older = createWorkout(state, 'withTemplates', new Date(2026, 0, 1)); const newer = createWorkout(state, 'withTemplates', new Date(2026, 5, 1)); expect(sortWorkoutsNewestFirst([older, newer]).map((item) => item.id)).toEqual([newer.id, older.id]) })
  it('vytvoří prázdný trénink s lokálním datem', () => { const workout = createWorkout(createInitialState(), 'empty', new Date(2026, 6, 14, 23, 30)); expect(workout.date).toBe('2026-07-14'); expect(workout.exercises).toEqual([]) })
})
