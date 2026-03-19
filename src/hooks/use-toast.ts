'use client'

import { toast as sonnerToast } from 'sonner'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    if (variant === 'destructive') {
      sonnerToast.error(title, {
        description,
      })
    } else {
      sonnerToast.success(title, {
        description,
      })
    }
  }

  return { toast }
}
