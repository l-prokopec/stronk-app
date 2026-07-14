import { useEffect, useRef } from 'react'

export function ConfirmDialog({ title, message, confirmLabel = 'Odstranit', onConfirm, onCancel }: { title: string; message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { cancelRef.current?.focus() }, [])
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
    <section className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <h2 id="confirm-title">{title}</h2><p id="confirm-message" className="muted">{message}</p>
      <div className="dialog-actions"><button ref={cancelRef} className="secondary" onClick={onCancel}>Zrušit</button><button className="danger" onClick={onConfirm}>{confirmLabel}</button></div>
    </section>
  </div>
}
