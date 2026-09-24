import { useState } from 'react'
import { useApp } from '../../app/AppContext'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { SortableItem, SortableList } from '../../components/SortableList'
import { AddExerciseDialog } from './AddExerciseDialog'
import { ExerciseCard } from './ExerciseCard'
import type { WorkoutExercise } from '../../types/workout'
import { cleanExerciseName } from '../../utils/exerciseName'

const hasValues = (exercise: WorkoutExercise) => (['lukas', 'terka'] as const).some((person) => exercise.setsByPerson[person].some((set) => set.weight || set.reps))
const nextExerciseId = (exercises: WorkoutExercise[]) => exercises.find((exercise) => !exercise.isCompleted && hasValues(exercise))?.id ?? exercises.find((exercise) => !exercise.isCompleted)?.id ?? null

export function WorkoutScreen({ onBack, onDeleteWorkout }: { onBack: () => void; onDeleteWorkout: (id: string) => void }) {
  const { state, dispatch, saveFailed } = useApp()
  const workout = state.workouts.find((item) => item.id === state.activeWorkoutId)
  const [showAdd, setShowAdd] = useState(false); const [confirmDelete, setConfirmDelete] = useState(false); const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(() => workout ? nextExerciseId(workout.exercises) : null)
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  if (!workout) return <main><button className="back-button" onClick={onBack}>← Zpět</button><EmptyState title="Trénink nebyl nalezen">Mohl být odstraněn v jiné kartě prohlížeče.</EmptyState></main>
  const saveName = (event: React.FormEvent) => {
    event.preventDefault()
    const name = cleanExerciseName(draftName)
    const issue = !name ? 'Zadejte název tréninku.' : name.length > 80 ? 'Název může mít nejvýše 80 znaků.' : null
    setNameError(issue)
    if (!issue) { dispatch({ type: 'RENAME_WORKOUT', workoutId: workout.id, name }); setEditingName(false) }
  }
  const completeExercise = (exerciseId: string) => { const remaining = workout.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, isCompleted: true } : exercise); setExpandedExerciseId(nextExerciseId(remaining)); dispatch({ type: 'COMPLETE_EXERCISE', workoutId: workout.id, exerciseId }) }
  const reopenExercise = (exerciseId: string) => { setExpandedExerciseId(exerciseId); dispatch({ type: 'REOPEN_EXERCISE', workoutId: workout.id, exerciseId }) }
  return <main className="workout-screen">
    <header className="screen-header workout-screen__header"><button className="back-button" onClick={onBack}>← Zpět</button><span className={saveFailed ? 'save-error' : 'saved'} role="status">{saveFailed ? 'Data se nepodařilo uložit do prohlížeče.' : 'Uloženo'}</span></header>
    <div className="workout-screen__content">
      <section className="workout-name-section">
        {editingName ? <form onSubmit={saveName} noValidate><label htmlFor="workout-name">Název tréninku</label><input id="workout-name" autoFocus value={draftName} maxLength={81} onChange={(event) => { setDraftName(event.target.value); setNameError(null) }} />{nameError && <p className="field-error" role="alert">{nameError}</p>}<div className="inline-actions"><button type="submit">Uložit název</button><button type="button" className="secondary" onClick={() => { setEditingName(false); setNameError(null) }}>Zrušit</button></div></form> : <div className="workout-name-heading"><h1>{workout.name}</h1><button className="secondary compact" onClick={() => { setDraftName(workout.name); setNameError(null); setEditingName(true) }}>Přejmenovat</button></div>}
      </section>
      <section className="date-field workout-date-section"><label htmlFor="workout-date">Datum tréninku</label><input className="workout-date-input" id="workout-date" type="date" value={workout.date} onChange={(event) => dispatch({ type: 'UPDATE_DATE', workoutId: workout.id, date: event.target.value })} /></section>
      <section className="exercise-list workout-exercises" aria-label="Cviky">
        {workout.exercises.length === 0
          ? <EmptyState title="Trénink nemá žádné cviky">Přidejte vlastní cvik a začněte zapisovat série.</EmptyState>
          : <SortableList
              ids={workout.exercises.map((exercise) => exercise.id)}
              onReorder={(activeId, overId) => dispatch({ type: 'REORDER_EXERCISES', workoutId: workout.id, activeId, overId })}
            >
              {workout.exercises.map((exercise) => <SortableItem key={exercise.id} id={exercise.id}>{(handle) => <ExerciseCard workoutId={workout.id} exercise={exercise} dragHandle={handle} expanded={expandedExerciseId === exercise.id} onToggle={() => setExpandedExerciseId((current) => current === exercise.id ? null : exercise.id)} onComplete={() => completeExercise(exercise.id)} onReopen={() => reopenExercise(exercise.id)} />}</SortableItem>)}
            </SortableList>}
      </section>
      <div className="bottom-actions"><button className="primary-action full workout-screen__primary-action" onClick={() => setShowAdd(true)}>+ Přidat cvik</button><button className="text-danger full" onClick={() => setConfirmDelete(true)}>Odstranit celý trénink</button></div>
    </div>
    {showAdd && <AddExerciseDialog templates={state.workoutTemplates} sourceTemplateId={workout.sourceTemplateId} onCancel={() => setShowAdd(false)} onAdd={(name, targetTemplateId) => { dispatch({ type: 'ADD_EXERCISE', workoutId: workout.id, name, targetTemplateId }); setShowAdd(false) }} />}
    {confirmDelete && <ConfirmDialog title="Odstranit celý trénink?" message="Trénink včetně všech zadaných sérií bude trvale odstraněn z tohoto prohlížeče." onCancel={() => setConfirmDelete(false)} onConfirm={() => onDeleteWorkout(workout.id)} />}
  </main>
}
