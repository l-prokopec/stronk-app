import { useState } from 'react'
import { useApp } from '../../app/AppContext'
import type { PersonProfile } from '../../types/workout'
import { createId } from '../../utils/id'

const COLORS = ['#63cdbb', '#f08aaa', '#8b7cff', '#f6c85f', '#69b7ff', '#a9dc76']
export function PeopleSettingsScreen({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useApp()
  const [people, setPeople] = useState(state.people)
  const [error, setError] = useState('')
  const update = (id: string, patch: Partial<PersonProfile>) => setPeople((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item))
  const save = () => {
    const trimmed = people.map((person) => ({ ...person, name: person.name.trim() }))
    if (!trimmed.length || trimmed.some((person) => !person.name)) return setError('Přidejte alespoň jednu osobu a vyplňte všechna jména.')
    dispatch({ type: 'SAVE_PEOPLE', people: trimmed }); onBack()
  }
  return <main><header className="screen-header"><button className="back-button" onClick={onBack}>← Zpět</button></header><h1>Lidé</h1><p className="muted intro">Toto nastavení se použije pouze pro nově vytvořené tréninky. Starší tréninky zůstanou beze změny.</p>
    <section className="people-list" aria-label="Seznam lidí">{people.map((person, index) => <div className="person-card" key={person.id}><label htmlFor={`person-name-${person.id}`}>Jméno osoby {index + 1}</label><div className="person-form"><input id={`person-name-${person.id}`} value={person.name} onChange={(event) => update(person.id, { name: event.target.value })} /><label className="color-field">Barva<input aria-label={`Barva pro ${person.name || `osobu ${index + 1}`}`} type="color" value={person.color} onChange={(event) => update(person.id, { color: event.target.value })} /></label><button className="text-danger" aria-label={`Odstranit ${person.name || `osobu ${index + 1}`}`} onClick={() => setPeople((items) => items.filter((item) => item.id !== person.id))}>Odstranit</button></div></div>)}</section>
    {error && <p className="field-error" role="alert">{error}</p>}
    <button className="secondary full" onClick={() => setPeople((items) => [...items, { id: createId(), name: '', color: COLORS[items.length % COLORS.length] }])}>+ Přidat osobu</button>
    <div className="bottom-actions"><button className="primary-action full" onClick={save}>Uložit lidi</button></div>
  </main>
}
