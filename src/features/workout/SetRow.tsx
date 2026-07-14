import type { PersonSet } from '../../types/workout'

export function SetRow({ set, index, displayName, genitiveName, exerciseName, onChange, onRemove }: { set: PersonSet; index: number; displayName: string; genitiveName: string; exerciseName: string; onChange: (field: 'reps' | 'weight', value: string) => void; onRemove: () => void }) {
  const update = (field: 'reps' | 'weight', value: string) => {
    const valid = field === 'weight' ? /^\d*(?:[.,]\d*)?$/.test(value) : /^\d*$/.test(value)
    if (valid) onChange(field, value)
  }
  const number = index + 1

  return <div className="person-set-grid person-set-row" role="group" aria-label={`${number}. série, ${displayName}, ${exerciseName}`}>
    <span className="set-number" aria-hidden="true">{number}</span>
    <input aria-label={`Opakování, ${number}. série, ${displayName}, ${exerciseName}`} inputMode="numeric" value={set.reps} onChange={(event) => update('reps', event.target.value)} />
    <input aria-label={`Váha v kilogramech, ${number}. série, ${displayName}, ${exerciseName}`} inputMode="decimal" value={set.weight} onChange={(event) => update('weight', event.target.value)} />
    <button className="set-delete" aria-label={`Odstranit ${number}. sérii ${genitiveName} u cviku ${exerciseName}`} onClick={onRemove}>
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" /></svg>
    </button>
  </div>
}
