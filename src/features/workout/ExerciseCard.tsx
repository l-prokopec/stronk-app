import { useState } from 'react'
import { useApp } from '../../app/AppContext'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import type { WorkoutExercise } from '../../types/workout'
import { PersonSetsEditor } from './PersonSetsEditor'

export function ExerciseCard({ workoutId, exercise }: { workoutId: string; exercise: WorkoutExercise }) {
  const { dispatch } = useApp(); const [confirmRemove, setConfirmRemove] = useState(false)
  const hasValues = (['lukas', 'terka'] as const).some((person) => exercise.setsByPerson[person].some((set) => set.weight || set.reps))
  const remove = () => hasValues ? setConfirmRemove(true) : dispatch({ type: 'REMOVE_EXERCISE', workoutId, exerciseId: exercise.id })
  return <article className="exercise-card">
    <div className="card-heading"><h3>{exercise.name}</h3><button className="text-danger small" aria-label={`Odstranit cvik ${exercise.name}`} onClick={remove}>Odstranit cvik</button></div>
    <PersonSetsEditor workoutId={workoutId} exercise={exercise} person="lukas" displayName="Lukáš" genitiveName="Lukáše" addName="Lukáše" />
    <PersonSetsEditor workoutId={workoutId} exercise={exercise} person="terka" displayName="Terka" genitiveName="Terky" addName="Terku" />
    {confirmRemove && <ConfirmDialog title={`Odstranit cvik ${exercise.name}?`} message="Zadané hodnoty v tomto cviku budou odstraněny. Výchozí šablona ani starší tréninky se nezmění." onCancel={() => setConfirmRemove(false)} onConfirm={() => { dispatch({ type: 'REMOVE_EXERCISE', workoutId, exerciseId: exercise.id }); setConfirmRemove(false) }} />}
  </article>
}
