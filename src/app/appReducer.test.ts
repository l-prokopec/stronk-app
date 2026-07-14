import { describe, expect, it } from 'vitest'
import { createInitialState } from '../storage/appStorage'
import type { AppState, Person } from '../types/workout'
import { appReducer } from './appReducer'

const withWorkout = () => appReducer(createInitialState(), { type: 'CREATE_WORKOUT', now: new Date(2026, 6, 14) })
const getExercise = (state: AppState, exerciseIndex = 0) => state.workouts[0].exercises[exerciseIndex]
const updateSet = (state: AppState, person: Person, field: 'reps' | 'weight', value: string, exerciseIndex = 0, setIndex = 0) => {
  const workout = state.workouts[0]
  const exercise = getExercise(state, exerciseIndex)
  return appReducer(state, { type: 'UPDATE_PERSON_SET', workoutId: workout.id, exerciseId: exercise.id, person, setId: exercise.setsByPerson[person][setIndex].id, field, value })
}
const addSet = (state: AppState, person: Person, exerciseIndex = 0) => {
  const workout = state.workouts[0]
  return appReducer(state, { type: 'ADD_PERSON_SET', workoutId: workout.id, exerciseId: getExercise(state, exerciseIndex).id, person })
}
const deleteSet = (state: AppState, person: Person, setIndex = 0, exerciseIndex = 0) => {
  const workout = state.workouts[0]
  const exercise = getExercise(state, exerciseIndex)
  return appReducer(state, { type: 'DELETE_PERSON_SET', workoutId: workout.id, exerciseId: exercise.id, person, setId: exercise.setsByPerson[person][setIndex].id })
}

describe('appReducer — série podle osoby', () => {
  it('přidání série Lukášovi nezmění Terku', () => {
    const state = withWorkout()
    const terkaSets = getExercise(state).setsByPerson.terka
    const next = addSet(state, 'lukas')
    expect(getExercise(next).setsByPerson.lukas).toHaveLength(2)
    expect(getExercise(next).setsByPerson.terka).toBe(terkaSets)
  })

  it('přidání série Terce nezmění Lukáše', () => {
    const state = withWorkout()
    const lukasSets = getExercise(state).setsByPerson.lukas
    const next = addSet(state, 'terka')
    expect(getExercise(next).setsByPerson.terka).toHaveLength(2)
    expect(getExercise(next).setsByPerson.lukas).toBe(lukasSets)
  })

  it.each<Person>(['lukas', 'terka'])('nová série osoby %s zdědí hodnoty z její poslední série', (person) => {
    let state = updateSet(withWorkout(), person, 'reps', '12')
    state = updateSet(state, person, 'weight', '36,5')
    const next = addSet(state, person)
    expect(getExercise(next).setsByPerson[person][1]).toMatchObject({ reps: '12', weight: '36,5' })
  })

  it('dědění nekopíruje hodnoty mezi osobami', () => {
    let state = updateSet(withWorkout(), 'lukas', 'reps', '20')
    state = updateSet(state, 'lukas', 'weight', '100')
    state = addSet(state, 'terka')
    expect(getExercise(state).setsByPerson.terka[1]).toMatchObject({ reps: '', weight: '' })
  })

  it('dědění nekopíruje hodnoty mezi cviky', () => {
    let state = updateSet(withWorkout(), 'lukas', 'reps', '20', 0)
    state = updateSet(state, 'lukas', 'weight', '100', 0)
    state = addSet(state, 'lukas', 1)
    expect(getExercise(state, 1).setsByPerson.lukas[1]).toMatchObject({ reps: '', weight: '' })
  })

  it('nová série má vlastní stabilní ID a vlastní objekt', () => {
    const state = withWorkout()
    const first = getExercise(state).setsByPerson.lukas[0]
    const second = getExercise(addSet(state, 'lukas')).setsByPerson.lukas[1]
    expect(second.id).not.toBe(first.id)
    expect(second).not.toBe(first)
  })

  it('změna zděděné série nezmění předchozí sérii', () => {
    let state = updateSet(withWorkout(), 'lukas', 'reps', '10')
    state = addSet(state, 'lukas')
    state = updateSet(state, 'lukas', 'reps', '8', 0, 1)
    expect(getExercise(state).setsByPerson.lukas.map((set) => set.reps)).toEqual(['10', '8'])
  })

  it('po smazání všech sérií vytvoří přidání prázdnou sérii', () => {
    let state = deleteSet(withWorkout(), 'lukas')
    expect(getExercise(state).setsByPerson.lukas).toEqual([])
    state = addSet(state, 'lukas')
    expect(getExercise(state).setsByPerson.lukas).toHaveLength(1)
    expect(getExercise(state).setsByPerson.lukas[0]).toMatchObject({ reps: '', weight: '' })
  })

  it('editace Lukášových opakování nezmění Terku', () => {
    const state = withWorkout()
    const terkaSets = getExercise(state).setsByPerson.terka
    const next = updateSet(state, 'lukas', 'reps', '15')
    expect(getExercise(next).setsByPerson.lukas[0].reps).toBe('15')
    expect(getExercise(next).setsByPerson.terka).toBe(terkaSets)
  })

  it('editace Terčiny váhy nezmění Lukáše', () => {
    const state = withWorkout()
    const lukasSets = getExercise(state).setsByPerson.lukas
    const next = updateSet(state, 'terka', 'weight', '42.5')
    expect(getExercise(next).setsByPerson.terka[0].weight).toBe('42.5')
    expect(getExercise(next).setsByPerson.lukas).toBe(lukasSets)
  })

  it.each<Person>(['lukas', 'terka'])('odstranění konkrétní série osoby %s neovlivní druhou osobu', (person) => {
    let state = addSet(withWorkout(), person)
    const other = person === 'lukas' ? 'terka' : 'lukas'
    const otherSets = getExercise(state).setsByPerson[other]
    const removedId = getExercise(state).setsByPerson[person][0].id
    const keptId = getExercise(state).setsByPerson[person][1].id
    state = deleteSet(state, person, 0)
    expect(getExercise(state).setsByPerson[person].map((set) => set.id)).toEqual([keptId])
    expect(getExercise(state).setsByPerson[person].some((set) => set.id === removedId)).toBe(false)
    expect(getExercise(state).setsByPerson[other]).toBe(otherSets)
  })

  it('lze odstranit poslední sérii pouze jedné osoby', () => {
    const state = withWorkout()
    const next = deleteSet(state, 'terka')
    expect(getExercise(next).setsByPerson.terka).toEqual([])
    expect(getExercise(next).setsByPerson.lukas).toHaveLength(1)
  })

  it('ID zbývajících sérií se po odstranění nemění', () => {
    let state = addSet(withWorkout(), 'lukas')
    state = addSet(state, 'lukas')
    const ids = getExercise(state).setsByPerson.lukas.map((set) => set.id)
    state = deleteSet(state, 'lukas', 1)
    expect(getExercise(state).setsByPerson.lukas.map((set) => set.id)).toEqual([ids[0], ids[2]])
  })

  it('změna jedné série zachová reference ostatních sérií a cviků', () => {
    let state = addSet(withWorkout(), 'lukas')
    const untouchedSet = getExercise(state).setsByPerson.lukas[1]
    const untouchedExercise = getExercise(state, 1)
    state = updateSet(state, 'lukas', 'reps', '9')
    expect(getExercise(state).setsByPerson.lukas[1]).toBe(untouchedSet)
    expect(getExercise(state, 1)).toBe(untouchedExercise)
  })
})

describe('appReducer — ostatní funkce', () => {
  it('vytvoří a otevře nový trénink', () => { const state = withWorkout(); expect(state.workouts).toHaveLength(1); expect(state.activeWorkoutId).toBe(state.workouts[0].id) })
  it('vytvoří a otevře prázdný trénink', () => { const state = appReducer(createInitialState(), { type: 'CREATE_WORKOUT', mode: 'empty', now: new Date(2026, 6, 14) }); expect(state.workouts[0].exercises).toEqual([]); expect(state.workouts[0].date).toBe('2026-07-14'); expect(state.activeWorkoutId).toBe(state.workouts[0].id) })
  it('otevře uložený trénink', () => { let state = withWorkout(); const id = state.workouts[0].id; state = appReducer(state, { type: 'CLOSE_WORKOUT' }); expect(appReducer(state, { type: 'OPEN_WORKOUT', id }).activeWorkoutId).toBe(id) })
  it('odstraní celý trénink a vyčistí aktivní ID', () => { const state = withWorkout(); const next = appReducer(state, { type: 'DELETE_WORKOUT', id: state.workouts[0].id }); expect(next.workouts).toHaveLength(0); expect(next.activeWorkoutId).toBeNull() })
  it('přidá vlastní cvik s jednou sérií pro každou osobu jen do tréninku', () => { const state = withWorkout(), count = state.exerciseTemplates.length, workout = state.workouts[0]; const next = appReducer(state, { type: 'ADD_EXERCISE', workoutId: workout.id, name: '  Hip thrust ', addToTemplates: false }); const exercise = next.workouts[0].exercises.at(-1)!; expect(exercise.name).toBe('Hip thrust'); expect(exercise.setsByPerson.lukas).toHaveLength(1); expect(exercise.setsByPerson.terka).toHaveLength(1); expect(next.exerciseTemplates).toHaveLength(count) })
  it('přidá vlastní cvik také mezi šablony', () => { const state = withWorkout(), workout = state.workouts[0]; const next = appReducer(state, { type: 'ADD_EXERCISE', workoutId: workout.id, name: 'Hip thrust', addToTemplates: true }); expect(next.exerciseTemplates.some((item) => item.name === 'Hip thrust')).toBe(true) })
  it('nevytvoří duplicitní šablonu kvůli mezerám nebo velikosti písmen', () => { const state = withWorkout(), workout = state.workouts[0], count = state.exerciseTemplates.length; const next = appReducer(state, { type: 'ADD_EXERCISE', workoutId: workout.id, name: '  LEG   PRESS ', addToTemplates: true }); expect(next.exerciseTemplates).toHaveLength(count) })
  it('deaktivuje šablonu a další trénink ji nepřevezme', () => { let state = createInitialState(); const template = state.exerciseTemplates[0]; state = appReducer(state, { type: 'TOGGLE_TEMPLATE', id: template.id }); state = appReducer(state, { type: 'CREATE_WORKOUT' }); expect(state.workouts[0].exercises.some((item) => item.name === template.name)).toBe(false) })
  it('odstranění šablony nemaže cvik ze staršího tréninku', () => { let state = withWorkout(); const template = state.exerciseTemplates[0]; state = appReducer(state, { type: 'DELETE_TEMPLATE', id: template.id }); expect(state.workouts[0].exercises.some((item) => item.name === template.name)).toBe(true) })
  it('přejmenování šablony nepřejmenuje starší cvik', () => { let state = withWorkout(); const template = state.exerciseTemplates[0]; state = appReducer(state, { type: 'RENAME_TEMPLATE', id: template.id, name: 'Nový název' }); expect(state.workouts[0].exercises[0].name).toBe('Leg press'); expect(state.exerciseTemplates[0].name).toBe('Nový název') })
  it('mění pořadí šablon', () => { const state = createInitialState(), second = state.exerciseTemplates[1]; const next = appReducer(state, { type: 'MOVE_TEMPLATE', id: second.id, direction: -1 }); expect([...next.exerciseTemplates].sort((a, b) => a.order - b.order)[0].id).toBe(second.id) })
})
