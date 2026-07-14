import { useState } from 'react'
import { useApp } from '../../app/AppContext'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { AddExerciseDialog } from './AddExerciseDialog'
import { ExerciseCard } from './ExerciseCard'

export function WorkoutScreen() {
  const { state, dispatch, saveFailed } = useApp(); const [showAdd, setShowAdd] = useState(false); const [confirmDelete, setConfirmDelete] = useState(false)
  const workout = state.workouts.find((item) => item.id === state.activeWorkoutId)
  if (!workout) return <main><button className="back-button" onClick={() => dispatch({ type: 'CLOSE_WORKOUT' })}>← Zpět</button><EmptyState title="Trénink nebyl nalezen">Mohl být odstraněn v jiné kartě prohlížeče.</EmptyState></main>
  return <main>
    <header className="screen-header"><button className="back-button" onClick={() => dispatch({ type: 'CLOSE_WORKOUT' })}>← Zpět</button><span className={saveFailed ? 'save-error' : 'saved'} role="status">{saveFailed ? 'Data se nepodařilo uložit do prohlížeče.' : 'Uloženo'}</span></header>
    <div className="date-field workout-date-section"><label htmlFor="workout-date">Datum tréninku</label><input className="workout-date-input" id="workout-date" type="date" value={workout.date} onChange={(event) => dispatch({ type: 'UPDATE_DATE', workoutId: workout.id, date: event.target.value })} /></div>
    <section className="exercise-list" aria-label="Cviky">
      {workout.exercises.length === 0 ? <EmptyState title="Trénink nemá žádné cviky">Přidejte vlastní cvik a začněte zapisovat série.</EmptyState> : workout.exercises.map((exercise) => <ExerciseCard key={exercise.id} workoutId={workout.id} exercise={exercise} />)}
    </section>
    <div className="bottom-actions"><button className="primary-action full" onClick={() => setShowAdd(true)}>+ Přidat cvik</button><button className="text-danger full" onClick={() => setConfirmDelete(true)}>Odstranit celý trénink</button></div>
    {showAdd && <AddExerciseDialog onCancel={() => setShowAdd(false)} onAdd={(name, addToTemplates) => { dispatch({ type: 'ADD_EXERCISE', workoutId: workout.id, name, addToTemplates }); setShowAdd(false) }} />}
    {confirmDelete && <ConfirmDialog title="Odstranit celý trénink?" message="Trénink včetně všech zadaných sérií bude trvale odstraněn z tohoto prohlížeče." onCancel={() => setConfirmDelete(false)} onConfirm={() => dispatch({ type: 'DELETE_WORKOUT', id: workout.id })} />}
  </main>
}
