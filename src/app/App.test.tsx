import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HOME_HISTORY_STATE, TEMPLATES_HISTORY_STATE, workoutHistoryState, type AppHistoryState } from '../navigation/appHistory'
import { createInitialState, STORAGE_KEY } from '../storage/appStorage'
import type { AppState } from '../types/workout'
import { App } from './App'
import { AppProvider } from './AppContext'
import { appReducer } from './appReducer'

const renderApp = (initialState: AppState = createInitialState()) => render(<AppProvider initialState={initialState}><App /></AppProvider>)
const stateWithClosedWorkout = () => { let state = appReducer(createInitialState(), { type: 'CREATE_WORKOUT', now: new Date(2026, 6, 14) }); state = appReducer(state, { type: 'CLOSE_WORKOUT' }); return state }
const setHistoryState = (state: AppHistoryState) => window.history.replaceState(state, '', window.location.href)
const dispatchPopState = (state: AppHistoryState) => act(() => { setHistoryState(state); window.dispatchEvent(new PopStateEvent('popstate', { state })) })

describe('uživatelské chování', () => {
  it('zobrazuje název Stronk App a oba způsoby vytvoření tréninku', () => { renderApp(); expect(screen.getByRole('heading', { name: 'Stronk App' })).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Nový trénink' })).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Prázdný trénink' })).toBeInTheDocument() })
  it('vloží datum, karty a hlavní akce běžného tréninku do společného wrapperu', async () => { const user = userEvent.setup(); renderApp(); expect(screen.getByText('Zatím žádný trénink')).toBeInTheDocument(); await user.click(screen.getByRole('button', { name: /nový trénink/i })); const dateInput = screen.getByLabelText('Datum tréninku'); const dateSection = dateInput.closest<HTMLElement>('.workout-date-section'); const content = dateInput.closest<HTMLElement>('.workout-screen__content'); expect(dateInput).toHaveClass('workout-date-input'); expect(dateInput.parentElement).toBe(dateSection); expect(content).toContainElement(screen.getByRole('heading', { name: 'Leg press' }).closest<HTMLElement>('.exercise-card')); expect(content).toContainElement(screen.getByRole('button', { name: '+ Přidat cvik' })) })
  it('vytvoří prázdný trénink, zachová společný wrapper a uloží ho do localStorage', async () => { const user = userEvent.setup(); renderApp(); await user.click(screen.getByRole('button', { name: 'Prázdný trénink' })); const emptyState = screen.getByText('Trénink nemá žádné cviky').closest<HTMLElement>('.empty-state'); const addButton = screen.getByRole('button', { name: '+ Přidat cvik' }); const content = screen.getByLabelText('Datum tréninku').closest<HTMLElement>('.workout-screen__content'); expect(content).toContainElement(emptyState); expect(content).toContainElement(addButton); await waitFor(() => { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as AppState; expect(stored.workouts).toHaveLength(1); expect(stored.workouts[0].exercises).toEqual([]); expect(stored.activeWorkoutId).toBe(stored.workouts[0].id) }) })
  it('upraví datum tréninku a změnu uloží do localStorage', async () => { const user = userEvent.setup(); renderApp(); await user.click(screen.getByRole('button', { name: /nový trénink/i })); const dateInput = screen.getByLabelText('Datum tréninku'); await user.clear(dateInput); await user.type(dateInput, '2026-08-21'); expect(dateInput).toHaveValue('2026-08-21'); await waitFor(() => { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as AppState; expect(stored.workouts[0].date).toBe('2026-08-21') }) })
  it('umožní zapsat jiné hodnoty pro Lukáše a Terku a přidat sérii', async () => { const user = userEvent.setup(); renderApp(); await user.click(screen.getByRole('button', { name: /nový trénink/i })); const card = screen.getByRole('heading', { name: 'Leg press' }).closest('article')!; await user.type(within(card).getByLabelText('Lukáš, váha, série 1'), '100,5'); await user.type(within(card).getByLabelText('Terka, opakování, série 1'), '12'); expect(within(card).getByLabelText('Lukáš, váha, série 1')).toHaveValue('100,5'); expect(within(card).getByLabelText('Terka, opakování, série 1')).toHaveValue('12'); await user.click(within(card).getByRole('button', { name: /přidat sérii/i })); expect(within(card).getByLabelText('Lukáš, váha, série 2')).toBeInTheDocument(); await user.click(within(card).getByRole('button', { name: 'Odstranit sérii 2' })); expect(within(card).queryByText('Série 2')).not.toBeInTheDocument() })
  it('validuje prázdný název vlastního cviku a pak cvik přidá', async () => { const user = userEvent.setup(); renderApp(); await user.click(screen.getByRole('button', { name: /nový trénink/i })); await user.click(screen.getByRole('button', { name: '+ Přidat cvik' })); const dialog = screen.getByRole('dialog'); await user.click(within(dialog).getByRole('button', { name: 'Přidat' })); expect(within(dialog).getByText('Zadejte název cviku.')).toBeInTheDocument(); await user.type(within(dialog).getByLabelText('Název cviku'), 'Hip thrust'); await user.click(within(dialog).getByRole('button', { name: 'Přidat' })); expect(screen.getByRole('heading', { name: 'Hip thrust' })).toBeInTheDocument() })
  it('spravuje aktivaci výchozího cviku', async () => { const user = userEvent.setup(); renderApp(); await user.click(screen.getByRole('button', { name: 'Výchozí cviky' })); const toggle = screen.getByRole('checkbox', { name: 'Přidávat cvik Leg press do nových tréninků' }); expect(toggle).toBeChecked(); await user.click(toggle); expect(toggle).not.toBeChecked() })
  it('zruší odstranění tréninku z dashboardu bez otevření detailu', async () => { const user = userEvent.setup(); let state = appReducer(createInitialState(), { type: 'CREATE_WORKOUT', now: new Date(2026, 6, 14) }); state = appReducer(state, { type: 'CLOSE_WORKOUT' }); renderApp(state); await user.click(screen.getByRole('button', { name: 'Odstranit trénink z 14. 7. 2026' })); expect(screen.queryByLabelText('Datum tréninku')).not.toBeInTheDocument(); const dialog = screen.getByRole('alertdialog'); expect(within(dialog).getByText(/14\. 7\. 2026/)).toBeInTheDocument(); await user.click(within(dialog).getByRole('button', { name: 'Zrušit' })); expect(screen.getByText('14. 7. 2026')).toBeInTheDocument() })
  it('potvrdí odstranění posledního tréninku a změnu uloží', async () => { const user = userEvent.setup(); let state = appReducer(createInitialState(), { type: 'CREATE_WORKOUT', now: new Date(2026, 6, 14) }); state = appReducer(state, { type: 'CLOSE_WORKOUT' }); renderApp(state); await user.click(screen.getByRole('button', { name: 'Odstranit trénink z 14. 7. 2026' })); await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Odstranit' })); expect(screen.getByText('Zatím žádný trénink')).toBeInTheDocument(); await waitFor(() => { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as AppState; expect(stored.workouts).toEqual([]) }) })
})

describe('browser history navigace', () => {
  it('inicializuje home entry právě jednou i po rerenderu', async () => {
    const replace = vi.spyOn(window.history, 'replaceState')
    const view = renderApp()
    await waitFor(() => expect(window.history.state).toEqual(HOME_HISTORY_STATE))
    expect(replace.mock.calls.filter(([state]) => (state as AppHistoryState | null)?.app === 'stronk-app')).toHaveLength(1)
    view.rerender(<AppProvider initialState={createInitialState()}><App /></AppProvider>)
    expect(replace.mock.calls.filter(([state]) => (state as AppHistoryState | null)?.app === 'stronk-app')).toHaveLength(1)
  })

  it('otevření uloženého tréninku vytvoří jedinou workout entry se správným ID', async () => {
    const user = userEvent.setup(); const state = stateWithClosedWorkout(); setHistoryState(HOME_HISTORY_STATE)
    const push = vi.spyOn(window.history, 'pushState'); renderApp(state)
    await user.click(screen.getByRole('button', { name: /14\. 7\. 2026.*9 cviků/ }))
    expect(push).toHaveBeenCalledTimes(1)
    expect(push.mock.calls[0][0]).toEqual(workoutHistoryState(state.workouts[0].id))
    expect(screen.getByLabelText('Datum tréninku')).toBeInTheDocument()
  })

  it.each([['Nový trénink', 'withTemplates'], ['Prázdný trénink', 'empty']] as const)('%s vytvoří právě jednu workout history entry', async (buttonName, mode) => {
    const user = userEvent.setup(); setHistoryState(HOME_HISTORY_STATE)
    const push = vi.spyOn(window.history, 'pushState'); renderApp()
    await user.click(screen.getByRole('button', { name: buttonName }))
    expect(push).toHaveBeenCalledTimes(1)
    const pushed = push.mock.calls[0][0] as AppHistoryState
    expect(pushed).toMatchObject({ app: 'stronk-app', screen: 'workout' })
    await waitFor(() => { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as AppState; expect(stored.workouts[0].id).toBe(pushed.screen === 'workout' ? pushed.workoutId : ''); expect(stored.workouts[0].exercises.length === 0).toBe(mode === 'empty') })
  })

  it('tlačítko zpět používá history.back bez vytvoření další entry', async () => {
    const user = userEvent.setup(); const state = stateWithClosedWorkout(); setHistoryState(HOME_HISTORY_STATE)
    const push = vi.spyOn(window.history, 'pushState'); const back = vi.spyOn(window.history, 'back').mockImplementation(() => {}); renderApp(state)
    await user.click(screen.getByRole('button', { name: /14\. 7\. 2026.*9 cviků/ })); await user.click(screen.getByRole('button', { name: '← Zpět' }))
    expect(back).toHaveBeenCalledTimes(1); expect(push).toHaveBeenCalledTimes(1)
  })

  it('popstate home zavře detail a zobrazí dashboard', async () => {
    const user = userEvent.setup(); const state = stateWithClosedWorkout(); setHistoryState(HOME_HISTORY_STATE); renderApp(state)
    await user.click(screen.getByRole('button', { name: /14\. 7\. 2026.*9 cviků/ })); dispatchPopState(HOME_HISTORY_STATE)
    expect(await screen.findByRole('heading', { name: 'Stronk App' })).toBeInTheDocument()
  })

  it('popstate workout otevře existující trénink', async () => {
    const state = stateWithClosedWorkout(); setHistoryState(HOME_HISTORY_STATE); renderApp(state)
    dispatchPopState(workoutHistoryState(state.workouts[0].id))
    expect(await screen.findByLabelText('Datum tréninku')).toBeInTheDocument()
  })

  it('reload s platnou workout entry bezpečně obnoví existující detail bez pushState', async () => {
    const state = stateWithClosedWorkout(); setHistoryState(workoutHistoryState(state.workouts[0].id))
    const push = vi.spyOn(window.history, 'pushState'); renderApp(state)
    expect(await screen.findByLabelText('Datum tréninku')).toBeInTheDocument(); expect(push).not.toHaveBeenCalled()
  })

  it('popstate s neexistujícím tréninkem bezpečně zůstane na dashboardu', async () => {
    setHistoryState(HOME_HISTORY_STATE); renderApp(); dispatchPopState(workoutHistoryState('missing-workout'))
    expect(await screen.findByRole('heading', { name: 'Stronk App' })).toBeInTheDocument()
    expect(window.history.state).toEqual(HOME_HISTORY_STATE)
  })

  it('správa výchozích cviků vytvoří templates entry a popstate home ji zavře', async () => {
    const user = userEvent.setup(); setHistoryState(HOME_HISTORY_STATE)
    const push = vi.spyOn(window.history, 'pushState'); renderApp()
    await user.click(screen.getByRole('button', { name: 'Výchozí cviky' }))
    expect(push).toHaveBeenCalledTimes(1); expect(push.mock.calls[0][0]).toEqual(TEMPLATES_HISTORY_STATE)
    dispatchPopState(HOME_HISTORY_STATE)
    expect(await screen.findByRole('heading', { name: 'Stronk App' })).toBeInTheDocument()
  })

  it('tlačítko zpět použije bezpečný home fallback bez platné app entry', async () => {
    const user = userEvent.setup(); const state = stateWithClosedWorkout(); setHistoryState(HOME_HISTORY_STATE); renderApp(state)
    dispatchPopState(workoutHistoryState(state.workouts[0].id)); expect(await screen.findByLabelText('Datum tréninku')).toBeInTheDocument()
    window.history.replaceState(null, '', window.location.href)
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {}); await user.click(screen.getByRole('button', { name: '← Zpět' }))
    expect(back).not.toHaveBeenCalled(); expect(await screen.findByRole('heading', { name: 'Stronk App' })).toBeInTheDocument(); expect(window.history.state).toEqual(HOME_HISTORY_STATE)
  })

  it('odstranění otevřeného tréninku nahradí entry domovskou a zobrazí dashboard', async () => {
    const user = userEvent.setup(); const state = stateWithClosedWorkout(); setHistoryState(HOME_HISTORY_STATE)
    const replace = vi.spyOn(window.history, 'replaceState'); renderApp(state)
    await user.click(screen.getByRole('button', { name: /14\. 7\. 2026.*9 cviků/ })); await user.click(screen.getByRole('button', { name: 'Odstranit celý trénink' })); await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Odstranit' }))
    expect(await screen.findByText('Zatím žádný trénink')).toBeInTheDocument(); expect(window.history.state).toEqual(HOME_HISTORY_STATE)
    expect(replace.mock.calls.some(([historyState]) => (historyState as AppHistoryState).screen === 'home')).toBe(true)
  })

  it('při unmountu odebere jediný popstate listener', () => {
    setHistoryState(HOME_HISTORY_STATE); const add = vi.spyOn(window, 'addEventListener'); const remove = vi.spyOn(window, 'removeEventListener'); const view = renderApp(); view.unmount()
    expect(add.mock.calls.filter(([type]) => type === 'popstate')).toHaveLength(1); expect(remove.mock.calls.filter(([type]) => type === 'popstate')).toHaveLength(1)
  })
})
