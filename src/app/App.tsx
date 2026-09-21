import { ExerciseTemplatesScreen } from '../features/templates/ExerciseTemplatesScreen'
import { HomeScreen } from '../features/home/HomeScreen'
import { WorkoutScreen } from '../features/workout/WorkoutScreen'
import { useAppHistory } from '../navigation/useAppHistory'
import { useApp } from './AppContext'

export function App() {
  const { state, saveFailed } = useApp()
  const navigation = useAppHistory()
  return <div className="app-shell">
    {saveFailed && !state.activeWorkoutId && <div className="global-error" role="status">Data se nepodařilo uložit do prohlížeče.</div>}
    {state.activeWorkoutId
      ? <WorkoutScreen onBack={navigation.backToHome} onDeleteWorkout={navigation.deleteOpenWorkout} />
      : navigation.screen === 'templates'
        ? <ExerciseTemplatesScreen onBack={navigation.backToHome} />
        : <HomeScreen onTemplates={navigation.openTemplates} onCreateWorkout={navigation.createWorkout} onOpenWorkout={navigation.openWorkout} />}
  </div>
}
