import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties, ReactNode } from 'react'

export type DragHandleProps = {
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
  setActivatorNodeRef: (element: HTMLElement | null) => void
}

export function SortableList({ ids, onReorder, children }: {
  ids: string[]
  onReorder: (activeId: string, overId: string) => void
  children: ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const finishDrag = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onReorder(String(active.id), String(over.id))
  }

  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={finishDrag}>
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>{children}</SortableContext>
  </DndContext>
}

export function SortableItem({ id, children }: { id: string; children: (handle: DragHandleProps) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 2 : undefined }

  return <div ref={setNodeRef} style={style} className={`sortable-item${isDragging ? ' sortable-item--dragging' : ''}`}>
    {children({ attributes, listeners, setActivatorNodeRef })}
  </div>
}

export function DragHandle({ label, attributes, listeners, setActivatorNodeRef }: { label: string } & DragHandleProps) {
  return <button
    ref={setActivatorNodeRef}
    className="drag-handle"
    type="button"
    aria-label={label}
    {...attributes}
    {...listeners}
  >
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="8" cy="7" r="1.5" /><circle cx="16" cy="7" r="1.5" />
      <circle cx="8" cy="12" r="1.5" /><circle cx="16" cy="12" r="1.5" />
      <circle cx="8" cy="17" r="1.5" /><circle cx="16" cy="17" r="1.5" />
    </svg>
  </button>
}
