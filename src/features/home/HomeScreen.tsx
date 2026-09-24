import { useState } from 'react'
import { useApp } from '../../app/AppContext'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { sortWorkoutsNewestFirst } from '../../domain/workouts'
import type { Workout } from '../../types/workout'
import { formatDate } from '../../utils/date'

const exerciseCount = (count: number) => count === 1 ? '1 cvik' : count >= 2 && count <= 4 ? `${count} cviky` : `${count} cviků`

export function HomeScreen({ onTemplates, onCreateWorkout, onOpenWorkout }: { onTemplates: () => void; onCreateWorkout: (templateId: string | null) => void; onOpenWorkout: (id: string) => void }) {
  const { state, dispatch } = useApp(); const workouts = sortWorkoutsNewestFirst(state.workouts)
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  return <main>
    <header className="home-header"><div><p className="eyebrow">Lukáš &amp; Terka</p><h1>Stronk App</h1></div><button className="secondary compact" onClick={onTemplates}>Šablony tréninků</button></header>
    <div className="creation-actions">
      <button className="primary-action full" onClick={() => setShowTemplatePicker(true)}>Nový trénink</button>
    </div>
    <section className="section" aria-labelledby="workouts-heading"><h2 id="workouts-heading">Tréninky</h2>
      {workouts.length === 0 ? <EmptyState title="Zatím žádný trénink">Založte první trénink výběrem šablony nebo prázdného tréninku.</EmptyState> :
        <div className="workout-list">{workouts.map((workout) => {
          const date = formatDate(workout.date)
          return <div className="workout-row" key={workout.id}>
            <button className="workout-open" onClick={() => onOpenWorkout(workout.id)}>
              <span><strong>{date} · {workout.sourceTemplateName}</strong><small>{exerciseCount(workout.exercises.length)}</small></span><span className="row-arrow" aria-hidden="true">›</span>
            </button>
            <button className="workout-delete" aria-label={`Odstranit trénink z ${date}`} onClick={() => setWorkoutToDelete(workout)}>
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" /></svg>
            </button>
          </div>
        })}</div>}
    </section>
    {showTemplatePicker && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowTemplatePicker(false) }}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="choose-template-title"><h2 id="choose-template-title">Vybrat šablonu tréninku</h2><div className="template-choice-list">{state.workoutTemplates.map((template) => <button className="secondary full" key={template.id} onClick={() => { setShowTemplatePicker(false); onCreateWorkout(template.id) }}>{template.name}</button>)}<button className="secondary full" onClick={() => { setShowTemplatePicker(false); onCreateWorkout(null) }}>Prázdný trénink</button></div><div className="dialog-actions"><button className="secondary" onClick={() => setShowTemplatePicker(false)}>Zrušit</button></div></section></div>}
    {workoutToDelete && <ConfirmDialog title="Odstranit trénink?" message={`Opravdu chcete odstranit trénink z ${formatDate(workoutToDelete.date)}?\nTuto akci nelze vrátit zpět.`} onCancel={() => setWorkoutToDelete(null)} onConfirm={() => { dispatch({ type: 'DELETE_WORKOUT', id: workoutToDelete.id }); setWorkoutToDelete(null) }} />}
  </main>
}
