import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../app/AppContext'
import type { WorkoutCreationMode } from '../types/workout'
import { createId } from '../utils/id'
import { currentAppHistoryState, ensureHomeHistoryEntry, isAppHistoryState, pushTemplatesHistory, pushWorkoutHistory, replaceHomeHistory } from './appHistory'

type AppScreen = 'home' | 'templates'

export function useAppHistory() {
  const { state, dispatch } = useApp()
  const [screen, setScreen] = useState<AppScreen>(() => currentAppHistoryState()?.screen === 'templates' ? 'templates' : 'home')
  const stateRef = useRef(state)

  useEffect(() => { stateRef.current = state }, [state])

  useEffect(() => {
    const showHistoryState = (historyState: unknown) => {
      if (!isAppHistoryState(historyState) || historyState.screen === 'home') {
        setScreen('home')
        dispatch({ type: 'CLOSE_WORKOUT' })
        if (!isAppHistoryState(historyState)) replaceHomeHistory()
        return
      }
      if (historyState.screen === 'templates') {
        dispatch({ type: 'CLOSE_WORKOUT' })
        setScreen('templates')
        return
      }
      if (stateRef.current.workouts.some((workout) => workout.id === historyState.workoutId)) {
        setScreen('home')
        dispatch({ type: 'OPEN_WORKOUT', id: historyState.workoutId })
        return
      }
      setScreen('home')
      dispatch({ type: 'CLOSE_WORKOUT' })
      replaceHomeHistory()
    }

    const initialState = currentAppHistoryState()
    if (!initialState) {
      replaceHomeHistory()
      if (stateRef.current.activeWorkoutId) dispatch({ type: 'CLOSE_WORKOUT' })
    } else if (initialState.screen === 'home') {
      if (stateRef.current.activeWorkoutId) dispatch({ type: 'CLOSE_WORKOUT' })
    } else if (initialState.screen === 'templates') {
      if (stateRef.current.activeWorkoutId) dispatch({ type: 'CLOSE_WORKOUT' })
    } else if (stateRef.current.workouts.some((workout) => workout.id === initialState.workoutId)) {
      dispatch({ type: 'OPEN_WORKOUT', id: initialState.workoutId })
    } else {
      replaceHomeHistory()
      if (stateRef.current.activeWorkoutId) dispatch({ type: 'CLOSE_WORKOUT' })
    }

    const onPopState = (event: PopStateEvent) => showHistoryState(event.state)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [dispatch])

  const openWorkout = useCallback((workoutId: string) => {
    if (!stateRef.current.workouts.some((workout) => workout.id === workoutId)) return
    ensureHomeHistoryEntry()
    setScreen('home')
    dispatch({ type: 'OPEN_WORKOUT', id: workoutId })
    pushWorkoutHistory(workoutId)
  }, [dispatch])

  const createWorkout = useCallback((mode: WorkoutCreationMode) => {
    ensureHomeHistoryEntry()
    const workoutId = createId()
    setScreen('home')
    dispatch({ type: 'CREATE_WORKOUT', mode, id: workoutId })
    pushWorkoutHistory(workoutId)
  }, [dispatch])

  const openTemplates = useCallback(() => {
    ensureHomeHistoryEntry()
    dispatch({ type: 'CLOSE_WORKOUT' })
    setScreen('templates')
    pushTemplatesHistory()
  }, [dispatch])

  const backToHome = useCallback(() => {
    const current = currentAppHistoryState()
    if (current && current.screen !== 'home') {
      window.history.back()
      return
    }
    dispatch({ type: 'CLOSE_WORKOUT' })
    setScreen('home')
    replaceHomeHistory()
  }, [dispatch])

  const deleteOpenWorkout = useCallback((workoutId: string) => {
    dispatch({ type: 'DELETE_WORKOUT', id: workoutId })
    setScreen('home')
    replaceHomeHistory()
  }, [dispatch])

  return { screen, openWorkout, createWorkout, openTemplates, backToHome, deleteOpenWorkout }
}
