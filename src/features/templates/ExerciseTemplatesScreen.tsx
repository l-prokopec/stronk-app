import { useState } from 'react'
import { useApp } from '../../app/AppContext'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { DragHandle, SortableItem, SortableList, type DragHandleProps } from '../../components/SortableList'
import { EmptyState } from '../../components/EmptyState'
import type { ExerciseTemplate, WorkoutTemplate } from '../../types/workout'
import { cleanExerciseName, normalizeExerciseName, validateExerciseName } from '../../utils/exerciseName'
import { createId } from '../../utils/id'

function ExerciseItem({ template, exercise, dragHandle }: { template: WorkoutTemplate; exercise: ExerciseTemplate; dragHandle: DragHandleProps }) {
  const { dispatch } = useApp()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(exercise.name)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const checkboxId = `template-enabled-${exercise.id}`
  const saveName = () => {
    const issue = validateExerciseName(name) ?? (template.exercises.some((item) => item.id !== exercise.id && normalizeExerciseName(item.name) === normalizeExerciseName(name)) ? 'Výchozí cvik s tímto názvem už existuje.' : null)
    setError(issue)
    if (!issue) { dispatch({ type: 'RENAME_TEMPLATE', workoutTemplateId: template.id, id: exercise.id, name }); setEditing(false) }
  }
  return <article className="template-card">
    {editing ? <div className="edit-template"><label htmlFor={`rename-${exercise.id}`}>Název cviku</label><input id={`rename-${exercise.id}`} autoFocus value={name} maxLength={81} onChange={(event) => { setName(event.target.value); setError(null) }} />{error && <p className="field-error" role="alert">{error}</p>}<div className="inline-actions"><button onClick={saveName}>Uložit název</button><button className="secondary" onClick={() => { setEditing(false); setName(exercise.name); setError(null) }}>Zrušit</button></div></div> : <div className="template-title"><DragHandle label={`Přesunout výchozí cvik ${exercise.name}`} {...dragHandle} /><strong>{exercise.name}</strong><button className="secondary compact" onClick={() => setEditing(true)}>Přejmenovat</button></div>}
    <div className="switch-row"><label htmlFor={checkboxId}><strong>Přidávat do nových tréninků</strong><small>{exercise.enabledByDefault ? 'Aktivní' : 'Neaktivní'}</small></label><div className="template-controls"><input id={checkboxId} type="checkbox" checked={exercise.enabledByDefault} onChange={() => dispatch({ type: 'TOGGLE_TEMPLATE', workoutTemplateId: template.id, id: exercise.id })} aria-label={`Přidávat cvik ${exercise.name} do nových tréninků`} /><button className="icon-danger" onClick={() => setConfirmDelete(true)} aria-label={`Odstranit výchozí cvik ${exercise.name}`}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" /></svg></button></div></div>
    {confirmDelete && <ConfirmDialog title={`Odstranit ${exercise.name}?`} message="Cvik zůstane v již vytvořených trénincích, ale nebude dostupný pro nové." onCancel={() => setConfirmDelete(false)} onConfirm={() => dispatch({ type: 'DELETE_TEMPLATE', workoutTemplateId: template.id, id: exercise.id })} />}
  </article>
}

function TemplateDetail({ template, onBack }: { template: WorkoutTemplate; onBack: () => void }) {
  const { dispatch } = useApp()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const exercises = [...template.exercises].sort((a, b) => a.order - b.order)
  const add = (event: React.FormEvent) => {
    event.preventDefault()
    const issue = validateExerciseName(name) ?? (exercises.some((item) => normalizeExerciseName(item.name) === normalizeExerciseName(name)) ? 'Výchozí cvik s tímto názvem už existuje.' : null)
    setError(issue)
    if (!issue) { dispatch({ type: 'ADD_TEMPLATE', workoutTemplateId: template.id, name: cleanExerciseName(name) }); setName('') }
  }
  return <main><header className="screen-header"><button className="back-button" onClick={onBack}>← Šablony</button></header><h1>{template.name}</h1><p className="muted intro">Aktivní cviky se v tomto pořadí přidají do tréninku vytvořeného z této šablony.</p>
    <form className="add-template" onSubmit={add} noValidate><label htmlFor="new-template">Nový výchozí cvik</label><div className="input-action"><input id="new-template" value={name} maxLength={81} onChange={(event) => { setName(event.target.value); setError(null) }} /><button type="submit">Přidat</button></div>{error && <p className="field-error" role="alert">{error}</p>}</form>
    <section className="template-list" aria-label="Seznam výchozích cviků">{exercises.length === 0 ? <EmptyState title="Žádné výchozí cviky">Přidejte cvik výše.</EmptyState> : <SortableList ids={exercises.map((item) => item.id)} onReorder={(activeId, overId) => dispatch({ type: 'REORDER_TEMPLATES', workoutTemplateId: template.id, activeId, overId })}>{exercises.map((item) => <SortableItem key={item.id} id={item.id}>{(handle) => <ExerciseItem template={template} exercise={item} dragHandle={handle} />}</SortableItem>)}</SortableList>}</section>
  </main>
}

export function ExerciseTemplatesScreen({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useApp()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<WorkoutTemplate | null>(null)
  const selected = state.workoutTemplates.find((item) => item.id === selectedId)
  if (selected) return <TemplateDetail template={selected} onBack={() => setSelectedId(null)} />

  const validName = (candidate: string, exceptId?: string) => validateExerciseName(candidate) ?? (state.workoutTemplates.some((item) => item.id !== exceptId && normalizeExerciseName(item.name) === normalizeExerciseName(candidate)) ? 'Šablona s tímto názvem už existuje.' : null)
  const add = (event: React.FormEvent) => { event.preventDefault(); const issue = validName(name); setError(issue); if (!issue) { dispatch({ type: 'ADD_WORKOUT_TEMPLATE', name }); setName('') } }
  const rename = (id: string) => { const issue = validName(editName, id); setError(issue); if (!issue) { dispatch({ type: 'RENAME_WORKOUT_TEMPLATE', id, name: editName }); setEditingId(null) } }
  const duplicate = (id: string) => { const newId = createId(); dispatch({ type: 'DUPLICATE_WORKOUT_TEMPLATE', id, newId }); setSelectedId(newId) }
  return <main><header className="screen-header"><button className="back-button" onClick={onBack}>← Zpět</button></header><h1>Šablony tréninků</h1><p className="muted intro">Každá šablona má vlastní seznam výchozích cviků.</p>
    <form className="add-template" onSubmit={add} noValidate><label htmlFor="new-workout-template">Nová šablona</label><div className="input-action"><input id="new-workout-template" value={name} maxLength={81} onChange={(event) => { setName(event.target.value); setError(null) }} /><button type="submit">Vytvořit</button></div>{!editingId && error && <p className="field-error" role="alert">{error}</p>}</form>
    <section className="template-list" aria-label="Šablony tréninků">{state.workoutTemplates.length === 0 ? <EmptyState title="Žádné šablony">Vytvořte šablonu výše, nebo založte prázdný trénink.</EmptyState> : state.workoutTemplates.map((template) => <article className="template-card" key={template.id}>
      {editingId === template.id ? <div className="edit-template"><label htmlFor={`workout-template-name-${template.id}`}>Název šablony</label><input id={`workout-template-name-${template.id}`} autoFocus value={editName} maxLength={81} onChange={(event) => { setEditName(event.target.value); setError(null) }} />{error && <p className="field-error" role="alert">{error}</p>}<div className="inline-actions"><button onClick={() => rename(template.id)}>Uložit název</button><button className="secondary" onClick={() => { setEditingId(null); setError(null) }}>Zrušit</button></div></div> : <><button className="template-open" onClick={() => setSelectedId(template.id)}><strong>{template.name}</strong><small>{template.exercises.filter((item) => item.enabledByDefault).length} aktivních cviků</small></button><div className="template-actions"><button className="secondary compact" onClick={() => duplicate(template.id)}>Duplikovat</button><button className="secondary compact" onClick={() => { setEditName(template.name); setEditingId(template.id); setError(null) }}>Přejmenovat</button><button className="text-danger compact" onClick={() => setConfirmDelete(template)}>Smazat</button></div></>}
    </article>)}</section>
    {confirmDelete && <ConfirmDialog title={`Smazat šablonu ${confirmDelete.name}?`} message="Již vytvořené tréninky a jejich série zůstanou beze změny." onCancel={() => setConfirmDelete(null)} onConfirm={() => { dispatch({ type: 'DELETE_WORKOUT_TEMPLATE', id: confirmDelete.id }); setConfirmDelete(null) }} />}
  </main>
}
