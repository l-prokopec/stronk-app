import { useApp } from '../../app/AppContext'
import { EmptyState } from '../../components/EmptyState'
import { sortWorkoutsNewestFirst } from '../../domain/workouts'
import { formatDate } from '../../utils/date'

const exerciseCount = (count: number) => count === 1 ? '1 cvik' : count >= 2 && count <= 4 ? `${count} cviky` : `${count} cviků`

export function HomeScreen({ onTemplates }: { onTemplates: () => void }) {
  const { state, dispatch } = useApp(); const workouts = sortWorkoutsNewestFirst(state.workouts)
  return <main>
    <header className="home-header"><div><p className="eyebrow">Lukáš &amp; Terka</p><h1>Tréninkový zápisník</h1></div><button className="secondary compact" onClick={onTemplates}>Výchozí cviky</button></header>
    <button className="primary-action full" onClick={() => dispatch({ type: 'CREATE_WORKOUT' })}>+ Nový trénink</button>
    <section className="section" aria-labelledby="workouts-heading"><h2 id="workouts-heading">Tréninky</h2>
      {workouts.length === 0 ? <EmptyState title="Zatím žádný trénink">Založte první trénink. Aktivní výchozí cviky se přidají automaticky.</EmptyState> :
        <div className="workout-list">{workouts.map((workout) => <button className="workout-row" key={workout.id} onClick={() => dispatch({ type: 'OPEN_WORKOUT', id: workout.id })}>
          <span><strong>{formatDate(workout.date)}</strong><small>{exerciseCount(workout.exercises.length)}</small></span><span aria-hidden="true">›</span>
        </button>)}</div>}
    </section>
  </main>
}
