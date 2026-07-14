import { useState } from 'react'
import { useApp } from '../../app/AppContext'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import type { ExerciseTemplate } from '../../types/workout'
import { cleanExerciseName, normalizeExerciseName, validateExerciseName } from '../../utils/exerciseName'

function TemplateItem({ template, index, total }: { template: ExerciseTemplate; index: number; total: number }) {
  const { state, dispatch } = useApp(); const [editing, setEditing] = useState(false); const [name, setName] = useState(template.name); const [error, setError] = useState<string | null>(null); const [confirmDelete, setConfirmDelete] = useState(false)
  const saveName = () => { const issue = validateExerciseName(name); const duplicate = state.exerciseTemplates.some((item) => item.id !== template.id && normalizeExerciseName(item.name) === normalizeExerciseName(name)); const result = issue ?? (duplicate ? 'Výchozí cvik s tímto názvem už existuje.' : null); setError(result); if (!result) { dispatch({ type: 'RENAME_TEMPLATE', id: template.id, name }); setEditing(false) } }
  return <article className="template-card">
    {editing ? <div className="edit-template"><label htmlFor={`rename-${template.id}`}>Název cviku</label><input id={`rename-${template.id}`} autoFocus value={name} maxLength={81} onChange={(event) => { setName(event.target.value); setError(null) }} />{error && <p className="field-error" role="alert">{error}</p>}<div className="inline-actions"><button onClick={saveName}>Uložit název</button><button className="secondary" onClick={() => { setEditing(false); setName(template.name); setError(null) }}>Zrušit</button></div></div> : <div className="template-title"><strong>{template.name}</strong><button className="secondary compact" onClick={() => setEditing(true)}>Přejmenovat</button></div>}
    <label className="switch-row"><span><strong>Přidávat do nových tréninků</strong><small>{template.enabledByDefault ? 'Aktivní' : 'Neaktivní'}</small></span><input type="checkbox" checked={template.enabledByDefault} onChange={() => dispatch({ type: 'TOGGLE_TEMPLATE', id: template.id })} aria-label={`Přidávat cvik ${template.name} do nových tréninků`} /></label>
    <div className="template-actions"><button className="secondary compact" disabled={index === 0} onClick={() => dispatch({ type: 'MOVE_TEMPLATE', id: template.id, direction: -1 })} aria-label={`Posunout cvik ${template.name} nahoru`}>↑ Nahoru</button><button className="secondary compact" disabled={index === total - 1} onClick={() => dispatch({ type: 'MOVE_TEMPLATE', id: template.id, direction: 1 })} aria-label={`Posunout cvik ${template.name} dolů`}>↓ Dolů</button><button className="text-danger compact" onClick={() => setConfirmDelete(true)} aria-label={`Odstranit výchozí cvik ${template.name}`}>Odstranit</button></div>
    {confirmDelete && <ConfirmDialog title={`Odstranit ${template.name}?`} message="Cvik zůstane v již vytvořených trénincích, ale nebude dostupný pro nové." onCancel={() => setConfirmDelete(false)} onConfirm={() => dispatch({ type: 'DELETE_TEMPLATE', id: template.id })} />}
  </article>
}

export function ExerciseTemplatesScreen({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useApp(); const [name, setName] = useState(''); const [error, setError] = useState<string | null>(null)
  const templates = [...state.exerciseTemplates].sort((a, b) => a.order - b.order)
  const add = (event: React.FormEvent) => { event.preventDefault(); const issue = validateExerciseName(name); const duplicate = templates.some((item) => normalizeExerciseName(item.name) === normalizeExerciseName(name)); const result = issue ?? (duplicate ? 'Výchozí cvik s tímto názvem už existuje.' : null); setError(result); if (!result) { dispatch({ type: 'ADD_TEMPLATE', name: cleanExerciseName(name) }); setName('') } }
  return <main><header className="screen-header"><button className="back-button" onClick={onBack}>← Zpět</button></header><h1>Výchozí cviky</h1><p className="muted intro">Aktivní cviky se v tomto pořadí přidají do každého nového tréninku.</p>
    <form className="add-template" onSubmit={add} noValidate><label htmlFor="new-template">Nový výchozí cvik</label><div className="input-action"><input id="new-template" value={name} maxLength={81} onChange={(event) => { setName(event.target.value); setError(null) }} /><button type="submit">Přidat</button></div>{error && <p className="field-error" role="alert">{error}</p>}</form>
    <section className="template-list" aria-label="Seznam výchozích cviků">{templates.length === 0 ? <EmptyState title="Žádné výchozí cviky">Přidejte cvik výše, nebo vytvořte prázdný trénink a přidejte cvik tam.</EmptyState> : templates.map((template, index) => <TemplateItem key={template.id} template={template} index={index} total={templates.length} />)}</section>
  </main>
}
