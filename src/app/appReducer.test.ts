import { describe, expect, it } from 'vitest'
import { createInitialState } from '../storage/appStorage'
import type { AppState, Person } from '../types/workout'
import { appReducer } from './appReducer'

const withWorkout = () => { const state = createInitialState(); return appReducer(state, { type: 'CREATE_WORKOUT', templateId: state.workoutTemplates[0].id, now: new Date(2026, 6, 14) }) }
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
  it('vytvoří a otevře prázdný trénink', () => { const state = appReducer(createInitialState(), { type: 'CREATE_WORKOUT', templateId: null, now: new Date(2026, 6, 14) }); expect(state.workouts[0].exercises).toEqual([]); expect(state.workouts[0].date).toBe('2026-07-14'); expect(state.activeWorkoutId).toBe(state.workouts[0].id) })
  it('otevře uložený trénink', () => { let state = withWorkout(); const id = state.workouts[0].id; state = appReducer(state, { type: 'CLOSE_WORKOUT' }); expect(appReducer(state, { type: 'OPEN_WORKOUT', id }).activeWorkoutId).toBe(id) })
  it('odstraní celý trénink a vyčistí aktivní ID', () => { const state = withWorkout(); const next = appReducer(state, { type: 'DELETE_WORKOUT', id: state.workouts[0].id }); expect(next.workouts).toHaveLength(0); expect(next.activeWorkoutId).toBeNull() })
  it('přidá vlastní cvik s jednou sérií pro každou osobu jen do tréninku', () => { const state = withWorkout(), count = state.workoutTemplates[0].exercises.length, workout = state.workouts[0]; const next = appReducer(state, { type: 'ADD_EXERCISE', workoutId: workout.id, name: '  Hip thrust ', targetTemplateId: null }); const exercise = next.workouts[0].exercises.at(-1)!; expect(exercise.name).toBe('Hip thrust'); expect(exercise.setsByPerson.lukas).toHaveLength(1); expect(exercise.setsByPerson.terka).toHaveLength(1); expect(next.workoutTemplates[0].exercises).toHaveLength(count) })
  it('označí cvik jako hotový', () => { const state = withWorkout(), workout = state.workouts[0], exercise = getExercise(state); const next = appReducer(state, { type: 'COMPLETE_EXERCISE', workoutId: workout.id, exerciseId: exercise.id }); expect(getExercise(next).isCompleted).toBe(true) })
  it('znovu otevře hotový cvik bez změny jeho sérií', () => { let state = updateSet(withWorkout(), 'lukas', 'reps', '12'); const workout = state.workouts[0], exercise = getExercise(state); state = appReducer(state, { type: 'COMPLETE_EXERCISE', workoutId: workout.id, exerciseId: exercise.id }); const sets = getExercise(state).setsByPerson; const next = appReducer(state, { type: 'REOPEN_EXERCISE', workoutId: workout.id, exerciseId: exercise.id }); expect(getExercise(next)).toMatchObject({ isCompleted: false, setsByPerson: sets }); expect(getExercise(next).setsByPerson).toBe(sets) })
  it('přidá vlastní cvik také do vybrané šablony', () => { const state = withWorkout(), workout = state.workouts[0], templateId = state.workoutTemplates[0].id; const next = appReducer(state, { type: 'ADD_EXERCISE', workoutId: workout.id, name: 'Hip thrust', targetTemplateId: templateId }); expect(next.workoutTemplates[0].exercises.some((item) => item.name === 'Hip thrust')).toBe(true) })
  it('nevytvoří duplicitní cvik v šabloně kvůli mezerám nebo velikosti písmen', () => { const state = withWorkout(), workout = state.workouts[0], count = state.workoutTemplates[0].exercises.length; const next = appReducer(state, { type: 'ADD_EXERCISE', workoutId: workout.id, name: '  LEG   PRESS ', targetTemplateId: state.workoutTemplates[0].id }); expect(next.workoutTemplates[0].exercises).toHaveLength(count) })
  it('deaktivuje cvik a další trénink jej nepřevezme', () => { let state = createInitialState(); const source = state.workoutTemplates[0], template = source.exercises[0]; state = appReducer(state, { type: 'TOGGLE_TEMPLATE', workoutTemplateId: source.id, id: template.id }); state = appReducer(state, { type: 'CREATE_WORKOUT', templateId: source.id }); expect(state.workouts[0].exercises.some((item) => item.name === template.name)).toBe(false) })
  it('odstranění cviku ze šablony nemaže cvik ze staršího tréninku', () => { let state = withWorkout(); const source = state.workoutTemplates[0], template = source.exercises[0]; state = appReducer(state, { type: 'DELETE_TEMPLATE', workoutTemplateId: source.id, id: template.id }); expect(state.workouts[0].exercises.some((item) => item.name === template.name)).toBe(true) })
  it('přejmenování cviku šablony nepřejmenuje starší cvik', () => { let state = withWorkout(); const source = state.workoutTemplates[0], template = source.exercises[0]; state = appReducer(state, { type: 'RENAME_TEMPLATE', workoutTemplateId: source.id, id: template.id, name: 'Nový název' }); expect(state.workouts[0].exercises[0].name).toBe('Kliky'); expect(state.workoutTemplates[0].exercises[0].name).toBe('Nový název') })
  it('mění pořadí cviků šablony přetažením', () => { const state = createInitialState(), source = state.workoutTemplates[0], first = source.exercises[0], third = source.exercises[2]; const next = appReducer(state, { type: 'REORDER_TEMPLATES', workoutTemplateId: source.id, activeId: first.id, overId: third.id }); expect(next.workoutTemplates[0].exercises.map((item) => item.id).slice(0, 3)).toEqual([source.exercises[1].id, third.id, first.id]); expect(next.workoutTemplates[0].exercises.map((item) => item.order).slice(0, 3)).toEqual([0, 1, 2]) })
  it('mění pořadí cviků pouze v určeném tréninku', () => { const state = withWorkout(), workout = state.workouts[0], first = workout.exercises[0], third = workout.exercises[2]; const next = appReducer(state, { type: 'REORDER_EXERCISES', workoutId: workout.id, activeId: first.id, overId: third.id }); expect(next.workouts[0].exercises.map((item) => item.id).slice(0, 3)).toEqual([workout.exercises[1].id, third.id, first.id]); expect(next.workouts[0].exercises.map((item) => item.order).slice(0, 3)).toEqual([0, 1, 2]) })
})

describe('šablony tréninků', () => {
  it('každá šablona vlastní nezávislý seznam cviků a nově vytvořený trénink je kopie', () => {
    let state = createInitialState()
    const originalId = state.workoutTemplates[0].id
    state = appReducer(state, { type: 'ADD_WORKOUT_TEMPLATE', name: 'Nohy' })
    const legsId = state.workoutTemplates[1].id
    state = appReducer(state, { type: 'ADD_TEMPLATE', workoutTemplateId: legsId, name: 'Dřepy' })
    state = appReducer(state, { type: 'ADD_TEMPLATE', workoutTemplateId: legsId, name: 'Výpady' })
    const first = state.workoutTemplates[1].exercises[0]
    const second = state.workoutTemplates[1].exercises[1]
    state = appReducer(state, { type: 'REORDER_TEMPLATES', workoutTemplateId: legsId, activeId: first.id, overId: second.id })
    state = appReducer(state, { type: 'CREATE_WORKOUT', templateId: legsId })
    const workout = state.workouts[0]
    expect(workout.exercises.map((item) => item.name)).toEqual(['Výpady', 'Dřepy'])
    expect(workout.sourceTemplateId).toBe(legsId)
    expect(workout.sourceTemplateName).toBe('Nohy')
    expect(workout.name).toBe('Nohy')
    state = appReducer(state, { type: 'RENAME_TEMPLATE', workoutTemplateId: legsId, id: second.id, name: 'Jiné výpady' })
    state = appReducer(state, { type: 'DELETE_TEMPLATE', workoutTemplateId: legsId, id: first.id })
    state = appReducer(state, { type: 'RENAME_WORKOUT_TEMPLATE', id: legsId, name: 'Spodní část' })
    expect(state.workoutTemplates[0].id).toBe(originalId)
    expect(state.workoutTemplates[0].exercises).toHaveLength(12)
    expect(state.workouts[0]).toEqual(workout)
  })

  it('přejmenuje pouze konkrétní trénink, zachová zdrojovou šablonu i sérii', () => {
    let state = withWorkout()
    const workout = state.workouts[0]
    state = updateSet(state, 'lukas', 'reps', '12')
    const exercise = state.workouts[0].exercises[0]
    state = appReducer(state, { type: 'RENAME_WORKOUT', workoutId: workout.id, name: '  Úterý   síla  ' })
    expect(state.workouts[0].name).toBe('Úterý síla')
    expect(state.workouts[0].sourceTemplateName).toBe('Výchozí trénink')
    expect(state.workouts[0].exercises[0]).toBe(exercise)
    expect(state.workoutTemplates[0].name).toBe('Výchozí trénink')
    expect(appReducer(state, { type: 'RENAME_WORKOUT', workoutId: workout.id, name: '  ' })).toBe(state)
  })

  it('duplikuje seznam včetně pořadí a aktivace do samostatné šablony', () => {
    let state = createInitialState()
    const source = state.workoutTemplates[0]
    state = appReducer(state, { type: 'TOGGLE_TEMPLATE', workoutTemplateId: source.id, id: source.exercises[1].id })
    state = appReducer(state, { type: 'REORDER_TEMPLATES', workoutTemplateId: source.id, activeId: source.exercises[0].id, overId: source.exercises[2].id })
    state = appReducer(state, { type: 'DUPLICATE_WORKOUT_TEMPLATE', id: source.id, newId: 'copy-1' })
    const original = state.workoutTemplates[0], copy = state.workoutTemplates[1]
    expect(copy).toMatchObject({ id: 'copy-1', name: 'Výchozí trénink (kopie)' })
    expect(copy.exercises.map(({ name, order, enabledByDefault }) => ({ name, order, enabledByDefault }))).toEqual(original.exercises.map(({ name, order, enabledByDefault }) => ({ name, order, enabledByDefault })))
    expect(copy.exercises.map((item) => item.id).every((id) => !original.exercises.some((item) => item.id === id))).toBe(true)
    state = appReducer(state, { type: 'RENAME_TEMPLATE', workoutTemplateId: copy.id, id: copy.exercises[0].id, name: 'Vlastní cvik' })
    expect(state.workoutTemplates[0].exercises[0].name).toBe(original.exercises[0].name)
    state = appReducer(state, { type: 'DUPLICATE_WORKOUT_TEMPLATE', id: source.id, newId: 'copy-2' })
    expect(state.workoutTemplates[2].name).toBe('Výchozí trénink (kopie 2)')
    expect(appReducer(state, { type: 'DUPLICATE_WORKOUT_TEMPLATE', id: 'missing', newId: 'copy-3' })).toBe(state)
  })

  it('smazání šablony zachová historický trénink včetně sérií a dokončení', () => {
    let state = withWorkout()
    const workout = state.workouts[0]
    state = updateSet(state, 'lukas', 'reps', '12')
    state = appReducer(state, { type: 'COMPLETE_EXERCISE', workoutId: workout.id, exerciseId: workout.exercises[0].id })
    const snapshot = state.workouts[0]
    state = appReducer(state, { type: 'DELETE_WORKOUT_TEMPLATE', id: state.workoutTemplates[0].id })
    expect(state.workoutTemplates).toEqual([])
    expect(state.workouts[0]).toEqual(snapshot)
    expect(state.workouts[0].exercises[0]).toMatchObject({ isCompleted: true, setsByPerson: { lukas: [{ reps: '12' }] } })
  })

  it('nedovolí založit trénink z neexistující šablony ani duplicitní název', () => {
    const state = createInitialState()
    expect(appReducer(state, { type: 'CREATE_WORKOUT', templateId: 'missing' })).toBe(state)
    expect(appReducer(state, { type: 'ADD_WORKOUT_TEMPLATE', name: '  výchozí   TRÉNINK ' })).toBe(state)
  })
})
