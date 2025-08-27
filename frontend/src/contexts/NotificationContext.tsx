import type { UseDialogState } from '@/hooks/use-dialog'
import { useToast } from '@/hooks/use-toast'
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'

interface NotificationContextType {
  // Toast functions
  showToast: (options: {
    title?: string
    description: string
    variant?: 'default' | 'destructive' | 'success'
  }) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  
  // Dialog functions
  showConfirm: (options: {
    title?: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
  }) => Promise<boolean>
  
  showPrompt: (options: {
    title?: string
    description: string
    placeholder?: string
    defaultValue?: string
    confirmText?: string
    cancelText?: string
  }) => Promise<{ confirmed: boolean; value?: string }>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
  dialogState: UseDialogState
}

export function NotificationProvider({ children, dialogState }: NotificationProviderProps) {
  const { toast } = useToast()

  const showToast = (options: {
    title?: string
    description: string
    variant?: 'default' | 'destructive' | 'success'
  }) => {
    toast({
      title: options.title,
      description: options.description,
      variant: options.variant || 'default',
      duration: 5000
    })
  }

  const showSuccess = (message: string) => {
    showToast({
      title: 'Успешно',
      description: message,
      variant: 'success'
    })
  }

  const showError = (message: string) => {
    showToast({
      title: 'Ошибка',
      description: message,
      variant: 'destructive'
    })
  }

  const showConfirm = (options: {
    title?: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
  }) => {
    return dialogState.showConfirmDialog(options)
  }

  const showPrompt = (options: {
    title?: string
    description: string
    placeholder?: string
    defaultValue?: string
    confirmText?: string
    cancelText?: string
  }) => {
    return dialogState.showPromptDialog(options)
  }

  const value: NotificationContextType = {
    showToast,
    showSuccess,
    showError,
    showConfirm,
    showPrompt
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}