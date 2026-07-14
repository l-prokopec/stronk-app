import { useApp } from '../../app/AppContext'
import type { Person, WorkoutExercise } from '../../types/workout'
import { SetRow } from './SetRow'

export function PersonSetsEditor({ workoutId, exercise, person, displayName, genitiveName, addName }: { workoutId: string; exercise: WorkoutExercise; person: Person; displayName: string; genitiveName: string; addName: string }) {
  const { dispatch } = useApp()
  const sets = exercise.setsByPerson[person]
  const headingId = `${exercise.id}-${person}-sets`

  return <section className={`person-sets person-sets--${person}`} aria-labelledby={headingId}>
    <div className="person-sets__heading"><h4 id={headingId}>{displayName}</h4></div>
    <div className="person-set-grid person-set-header" aria-hidden="true"><span>Série</span><span>Opakování</span><span>Váha (kg)</span><span /></div>
    {sets.length === 0
      ? <p className="no-sets muted">Žádné série</p>
      : sets.map((set, index) => <SetRow key={set.id} set={set} index={index} displayName={displayName} genitiveName={genitiveName} exerciseName={exercise.name}
          onChange={(field, value) => dispatch({ type: 'UPDATE_PERSON_SET', workoutId, exerciseId: exercise.id, person, setId: set.id, field, value })}
          onRemove={() => dispatch({ type: 'DELETE_PERSON_SET', workoutId, exerciseId: exercise.id, person, setId: set.id })} />)}
    <button className={`add-person-set add-person-set--${person}`} aria-label={`Přidat sérii pro ${addName}`} onClick={() => dispatch({ type: 'ADD_PERSON_SET', workoutId, exerciseId: exercise.id, person })}>+ Přidat sérii</button>
  </section>
}
