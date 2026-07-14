import type { Person, WorkoutSet } from '../../types/workout'

export function WorkoutSetEditor({ set, index, canRemove, onChange, onRemove }: { set: WorkoutSet; index: number; canRemove: boolean; onChange: (person: Person, field: 'weight' | 'reps', value: string) => void; onRemove: () => void }) {
  const update = (person: Person, field: 'weight' | 'reps', value: string) => {
    const valid = field === 'weight' ? /^\d*(?:[.,]\d*)?$/.test(value) : /^\d*$/.test(value)
    if (valid) onChange(person, field, value)
  }
  return <section className="set-card" aria-labelledby={`set-${set.id}`}>
    <div className="set-heading"><h4 id={`set-${set.id}`}>Série {index + 1}</h4>{canRemove && <button className="text-danger small" aria-label={`Odstranit sérii ${index + 1}`} onClick={onRemove}>Odstranit</button>}</div>
    <div className="people-grid">
      {([['lukas', 'Lukáš'], ['terka', 'Terka']] as const).map(([person, label]) => <fieldset key={person}>
        <legend>{label}</legend><div className="input-pair">
          <label>Váha<input aria-label={`${label}, váha, série ${index + 1}`} inputMode="decimal" value={set[person].weight} onChange={(event) => update(person, 'weight', event.target.value)} /><span>kg</span></label>
          <label>Opakování<input aria-label={`${label}, opakování, série ${index + 1}`} inputMode="numeric" value={set[person].reps} onChange={(event) => update(person, 'reps', event.target.value)} /></label>
        </div>
      </fieldset>)}
    </div>
  </section>
}
