'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface SortableFieldProps {
  id: string
  children: React.ReactNode
}

export function SortableField({ id, children }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center gap-3">
      <div {...listeners} className="cursor-grab hover:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      {children}
    </div>
  )
}
