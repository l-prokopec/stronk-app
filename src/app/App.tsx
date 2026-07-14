import { useState } from 'react'
import { ExerciseTemplatesScreen } from '../features/templates/ExerciseTemplatesScreen'
import { HomeScreen } from '../features/home/HomeScreen'
import { WorkoutScreen } from '../features/workout/WorkoutScreen'
import { useApp } from './AppContext'

export function App() {
  const { state, saveFailed } = useApp(); const [screen, setScreen] = useState<'home' | 'templates'>('home')
  return <div className="app-shell">
    {saveFailed && !state.activeWorkoutId && <div className="global-error" role="status">Data se nepodařilo uložit do prohlížeče.</div>}
    {state.activeWorkoutId ? <WorkoutScreen /> : screen === 'templates' ? <ExerciseTemplatesScreen onBack={() => setScreen('home')} /> : <HomeScreen onTemplates={() => setScreen('templates')} />}
  </div>
}
