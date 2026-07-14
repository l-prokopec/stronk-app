import { createContext, useContext, useEffect, useReducer, useState, type Dispatch, type ReactNode } from 'react'
import { loadState, saveState } from '../storage/appStorage'
import type { AppState } from '../types/workout'
import { appReducer, type AppAction } from './appReducer'

type AppContextValue = { state: AppState; dispatch: Dispatch<AppAction>; saveFailed: boolean }
const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children, initialState }: { children: ReactNode; initialState?: AppState }) {
  const [state, dispatch] = useReducer(appReducer, initialState, (provided) => provided ?? loadState())
  const [saveFailed, setSaveFailed] = useState(false)
  useEffect(() => {
    const failed = !saveState(state)
    // Stav výsledku persistence aktualizujeme mimo synchronní tělo effectu, aby nevznikl kaskádový render.
    const update = window.setTimeout(() => setSaveFailed(failed), 0)
    return () => window.clearTimeout(update)
  }, [state])
  return <AppContext.Provider value={{ state, dispatch, saveFailed }}>{children}</AppContext.Provider>
}

export const useApp = (): AppContextValue => {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp musí být použit uvnitř AppProvider')
  return value
}
