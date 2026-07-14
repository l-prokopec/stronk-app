import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createInitialState } from '../storage/appStorage'
import { App } from './App'
import { AppProvider } from './AppContext'

const renderApp = () => render(<AppProvider initialState={createInitialState()}><App /></AppProvider>)

describe('uživatelské chování', () => {
  it('zobrazí prázdný stav a vytvoří nový trénink', async () => { const user = userEvent.setup(); renderApp(); expect(screen.getByText('Zatím žádný trénink')).toBeInTheDocument(); await user.click(screen.getByRole('button', { name: /nový trénink/i })); expect(screen.getByLabelText('Datum tréninku')).toBeInTheDocument(); expect(screen.getByRole('heading', { name: 'Leg press' })).toBeInTheDocument() })
  it('umožní zapsat jiné hodnoty pro Lukáše a Terku a přidat sérii', async () => { const user = userEvent.setup(); renderApp(); await user.click(screen.getByRole('button', { name: /nový trénink/i })); const card = screen.getByRole('heading', { name: 'Leg press' }).closest('article')!; await user.type(within(card).getByLabelText('Lukáš, váha, série 1'), '100,5'); await user.type(within(card).getByLabelText('Terka, opakování, série 1'), '12'); expect(within(card).getByLabelText('Lukáš, váha, série 1')).toHaveValue('100,5'); expect(within(card).getByLabelText('Terka, opakování, série 1')).toHaveValue('12'); await user.click(within(card).getByRole('button', { name: /přidat sérii/i })); expect(within(card).getByLabelText('Lukáš, váha, série 2')).toBeInTheDocument(); await user.click(within(card).getByRole('button', { name: 'Odstranit sérii 2' })); expect(within(card).queryByText('Série 2')).not.toBeInTheDocument() })
  it('validuje prázdný název vlastního cviku a pak cvik přidá', async () => { const user = userEvent.setup(); renderApp(); await user.click(screen.getByRole('button', { name: /nový trénink/i })); await user.click(screen.getByRole('button', { name: '+ Přidat cvik' })); const dialog = screen.getByRole('dialog'); await user.click(within(dialog).getByRole('button', { name: 'Přidat' })); expect(within(dialog).getByText('Zadejte název cviku.')).toBeInTheDocument(); await user.type(within(dialog).getByLabelText('Název cviku'), 'Hip thrust'); await user.click(within(dialog).getByRole('button', { name: 'Přidat' })); expect(screen.getByRole('heading', { name: 'Hip thrust' })).toBeInTheDocument() })
  it('spravuje aktivaci výchozího cviku', async () => { const user = userEvent.setup(); renderApp(); await user.click(screen.getByRole('button', { name: 'Výchozí cviky' })); const toggle = screen.getByRole('checkbox', { name: 'Přidávat cvik Leg press do nových tréninků' }); expect(toggle).toBeChecked(); await user.click(toggle); expect(toggle).not.toBeChecked() })
})
