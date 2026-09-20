import { useState } from 'react'
import { useApp } from '../../app/AppContext'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { DragHandle, type DragHandleProps } from '../../components/SortableList'
import type { WorkoutExercise } from '../../types/workout'
import { PersonSetsEditor } from './PersonSetsEditor'

export function ExerciseCard({ workoutId, exercise, dragHandle }: { workoutId: string; exercise: WorkoutExercise; dragHandle: DragHandleProps }) {
  const { dispatch } = useApp(); const [confirmRemove, setConfirmRemove] = useState(false); const [expanded, setExpanded] = useState(false)
  const hasValues = (['lukas', 'terka'] as const).some((person) => exercise.setsByPerson[person].some((set) => set.weight || set.reps))
  const remove = () => hasValues ? setConfirmRemove(true) : dispatch({ type: 'REMOVE_EXERCISE', workoutId, exerciseId: exercise.id })
  return <article className="exercise-card">
    <div className="card-heading">
      <DragHandle label={`Přesunout cvik ${exercise.name}`} {...dragHandle} />
      <h3><button className="exercise-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}><span>{exercise.name}</span><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 9 5 5 5-5" /></svg></button></h3>
      <button className="icon-danger" aria-label={`Odstranit cvik ${exercise.name}`} onClick={remove}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" /></svg></button>
    </div>
    {expanded && <div className="exercise-card__content">
      <PersonSetsEditor workoutId={workoutId} exercise={exercise} person="lukas" displayName="Lukáš" genitiveName="Lukáše" addName="Lukáše" />
      <PersonSetsEditor workoutId={workoutId} exercise={exercise} person="terka" displayName="Terka" genitiveName="Terky" addName="Terku" />
    </div>}
    {confirmRemove && <ConfirmDialog title={`Odstranit cvik ${exercise.name}?`} message="Zadané hodnoty v tomto cviku budou odstraněny. Výchozí šablona ani starší tréninky se nezmění." onCancel={() => setConfirmRemove(false)} onConfirm={() => { dispatch({ type: 'REMOVE_EXERCISE', workoutId, exerciseId: exercise.id }); setConfirmRemove(false) }} />}
  </article>
}
