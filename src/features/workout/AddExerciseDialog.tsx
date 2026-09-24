import { useEffect, useRef, useState } from 'react'
import { cleanExerciseName, validateExerciseName } from '../../utils/exerciseName'
import type { WorkoutTemplate } from '../../types/workout'

export function AddExerciseDialog({ onAdd, onCancel, templates, sourceTemplateId }: { onAdd: (name: string, targetTemplateId: string | null) => void; onCancel: () => void; templates: WorkoutTemplate[]; sourceTemplateId?: string | null }) {
  const [name, setName] = useState(''); const [addToTemplates, setAddToTemplates] = useState(false); const [targetTemplateId, setTargetTemplateId] = useState(sourceTemplateId && templates.some((item) => item.id === sourceTemplateId) ? sourceTemplateId : templates[0]?.id ?? ''); const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])
  const submit = (event: React.FormEvent) => { event.preventDefault(); const issue = validateExerciseName(name); setError(issue); if (!issue) onAdd(cleanExerciseName(name), addToTemplates ? targetTemplateId : null) }
  return <div className="dialog-backdrop" role="presentation">
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="add-exercise-title">
      <h2 id="add-exercise-title">Přidat cvik</h2>
      <form onSubmit={submit} noValidate>
        <label htmlFor="exercise-name">Název cviku</label><input ref={inputRef} id="exercise-name" value={name} maxLength={81} onChange={(event) => { setName(event.target.value); setError(null) }} aria-describedby={error ? 'exercise-error' : undefined} aria-invalid={Boolean(error)} />
        {error && <p className="field-error" id="exercise-error" role="alert">{error}</p>}
        {templates.length > 0 && <><label className="check-row"><input type="checkbox" checked={addToTemplates} onChange={(event) => setAddToTemplates(event.target.checked)} /> Přidat také mezi výchozí cviky</label>{addToTemplates && <><label htmlFor="target-template">Šablona tréninku</label><select id="target-template" value={targetTemplateId} onChange={(event) => setTargetTemplateId(event.target.value)}>{templates.map((template) => <option value={template.id} key={template.id}>{template.name}</option>)}</select></>}</>}
        <div className="dialog-actions"><button type="button" className="secondary" onClick={onCancel}>Zrušit</button><button type="submit">Přidat</button></div>
      </form>
    </section>
  </div>
}
