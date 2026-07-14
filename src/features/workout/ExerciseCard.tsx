import { useState } from 'react'
import { useApp } from '../../app/AppContext'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import type { WorkoutExercise } from '../../types/workout'
import { WorkoutSetEditor } from './WorkoutSetEditor'

export function ExerciseCard({ workoutId, exercise }: { workoutId: string; exercise: WorkoutExercise }) {
  const { dispatch } = useApp(); const [confirmRemove, setConfirmRemove] = useState(false)
  const hasValues = exercise.sets.some((set) => set.lukas.weight || set.lukas.reps || set.terka.weight || set.terka.reps)
  const remove = () => hasValues ? setConfirmRemove(true) : dispatch({ type: 'REMOVE_EXERCISE', workoutId, exerciseId: exercise.id })
  return <article className="exercise-card">
    <div className="card-heading"><h3>{exercise.name}</h3><button className="text-danger small" aria-label={`Odstranit cvik ${exercise.name}`} onClick={remove}>Odstranit cvik</button></div>
    {exercise.sets.map((set, index) => <WorkoutSetEditor key={set.id} set={set} index={index} canRemove={exercise.sets.length > 1}
      onRemove={() => dispatch({ type: 'REMOVE_SET', workoutId, exerciseId: exercise.id, setId: set.id })}
      onChange={(person, field, value) => dispatch({ type: 'UPDATE_SET', workoutId, exerciseId: exercise.id, setId: set.id, person, field, value })} />)}
    <button className="secondary full" onClick={() => dispatch({ type: 'ADD_SET', workoutId, exerciseId: exercise.id })}>+ Přidat sérii</button>
    {confirmRemove && <ConfirmDialog title={`Odstranit cvik ${exercise.name}?`} message="Zadané hodnoty v tomto cviku budou odstraněny. Výchozí šablona ani starší tréninky se nezmění." onCancel={() => setConfirmRemove(false)} onConfirm={() => { dispatch({ type: 'REMOVE_EXERCISE', workoutId, exerciseId: exercise.id }); setConfirmRemove(false) }} />}
  </article>
}
