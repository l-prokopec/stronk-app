export type AppHistoryState =
  | { app: 'stronk-app'; screen: 'home' }
  | { app: 'stronk-app'; screen: 'workout'; workoutId: string }
  | { app: 'stronk-app'; screen: 'templates' }

export const HOME_HISTORY_STATE: AppHistoryState = { app: 'stronk-app', screen: 'home' }
export const TEMPLATES_HISTORY_STATE: AppHistoryState = { app: 'stronk-app', screen: 'templates' }

export const workoutHistoryState = (workoutId: string): AppHistoryState => ({ app: 'stronk-app', screen: 'workout', workoutId })

export const isAppHistoryState = (value: unknown): value is AppHistoryState => {
  if (!value || typeof value !== 'object' || !('app' in value) || !('screen' in value)) return false
  if (value.app !== 'stronk-app') return false
  if (value.screen === 'home' || value.screen === 'templates') return true
  return value.screen === 'workout' && 'workoutId' in value && typeof value.workoutId === 'string'
}

export const currentAppHistoryState = (): AppHistoryState | null => isAppHistoryState(window.history.state) ? window.history.state : null

const currentUrl = () => window.location.href

export const replaceHomeHistory = (): void => window.history.replaceState(HOME_HISTORY_STATE, '', currentUrl())
export const pushWorkoutHistory = (workoutId: string): void => window.history.pushState(workoutHistoryState(workoutId), '', currentUrl())
export const pushTemplatesHistory = (): void => window.history.pushState(TEMPLATES_HISTORY_STATE, '', currentUrl())

export const ensureHomeHistoryEntry = (): void => {
  if (!currentAppHistoryState()) replaceHomeHistory()
}
