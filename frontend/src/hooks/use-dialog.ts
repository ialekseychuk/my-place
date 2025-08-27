import { useCallback, useState } from 'react'

export interface ConfirmDialogOptions {
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

export interface PromptDialogOptions {
  title?: string
  description: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
  cancelText?: string
}

export interface PromptResult {
  confirmed: boolean
  value?: string
}

export interface UseDialogState {
  // Confirmation dialog
  showConfirmDialog: (options: ConfirmDialogOptions) => Promise<boolean>
  confirmDialogState: {
    isOpen: boolean
    options: ConfirmDialogOptions | null
    resolve: ((value: boolean) => void) | null
  }
  
  // Prompt dialog
  showPromptDialog: (options: PromptDialogOptions) => Promise<PromptResult>
  promptDialogState: {
    isOpen: boolean
    options: PromptDialogOptions | null
    value: string
    resolve: ((value: PromptResult) => void) | null
  }
  setPromptValue: (value: string) => void
  
  // Actions
  handleConfirm: () => void
  handleCancel: () => void
  handlePromptConfirm: () => void
  handlePromptCancel: () => void
}

export function useDialog(): UseDialogState {
  const [confirmDialogState, setConfirmDialogState] = useState<{
    isOpen: boolean
    options: ConfirmDialogOptions | null
    resolve: ((value: boolean) => void) | null
  }>({
    isOpen: false,
    options: null,
    resolve: null
  })

  const [promptDialogState, setPromptDialogState] = useState<{
    isOpen: boolean
    options: PromptDialogOptions | null
    value: string
    resolve: ((value: PromptResult) => void) | null
  }>({
    isOpen: false,
    options: null,
    value: '',
    resolve: null
  })

  const showConfirmDialog = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialogState({
        isOpen: true,
        options,
        resolve
      })
    })
  }, [])

  const showPromptDialog = useCallback((options: PromptDialogOptions): Promise<PromptResult> => {
    return new Promise((resolve) => {
      setPromptDialogState({
        isOpen: true,
        options,
        value: options.defaultValue || '',
        resolve
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (confirmDialogState.resolve) {
      confirmDialogState.resolve(true)
    }
    setConfirmDialogState({
      isOpen: false,
      options: null,
      resolve: null
    })
  }, [confirmDialogState.resolve])

  const handleCancel = useCallback(() => {
    if (confirmDialogState.resolve) {
      confirmDialogState.resolve(false)
    }
    setConfirmDialogState({
      isOpen: false,
      options: null,
      resolve: null
    })
  }, [confirmDialogState.resolve])

  const handlePromptConfirm = useCallback(() => {
    if (promptDialogState.resolve) {
      promptDialogState.resolve({
        confirmed: true,
        value: promptDialogState.value
      })
    }
    setPromptDialogState({
      isOpen: false,
      options: null,
      value: '',
      resolve: null
    })
  }, [promptDialogState.resolve, promptDialogState.value])

  const handlePromptCancel = useCallback(() => {
    if (promptDialogState.resolve) {
      promptDialogState.resolve({
        confirmed: false
      })
    }
    setPromptDialogState({
      isOpen: false,
      options: null,
      value: '',
      resolve: null
    })
  }, [promptDialogState.resolve])

  const setPromptValue = useCallback((value: string) => {
    setPromptDialogState(prev => ({
      ...prev,
      value
    }))
  }, [])

  return {
    showConfirmDialog,
    confirmDialogState,
    showPromptDialog,
    promptDialogState,
    setPromptValue,
    handleConfirm,
    handleCancel,
    handlePromptConfirm,
    handlePromptCancel
  }
}