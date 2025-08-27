import type { UseDialogState } from '@/hooks/use-dialog'
import type { ReactNode } from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './ui/alert-dialog'
import { Button } from './ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface DialogProviderProps {
  dialogState: UseDialogState
  children: ReactNode
}

export function DialogProvider({ dialogState, children }: DialogProviderProps) {
  const {
    confirmDialogState,
    promptDialogState,
    handleConfirm,
    handleCancel,
    handlePromptConfirm,
    handlePromptCancel,
    setPromptValue
  } = dialogState

  return (
    <>
      {children}
      
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogState.isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialogState.options?.title || 'Подтверждение'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialogState.options?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {confirmDialogState.options?.cancelText || 'Отмена'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              className={confirmDialogState.options?.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {confirmDialogState.options?.confirmText || 'Подтвердить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Prompt Dialog */}
      <Dialog open={promptDialogState.isOpen} onOpenChange={(open) => !open && handlePromptCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {promptDialogState.options?.title || 'Ввод данных'}
            </DialogTitle>
            <DialogDescription>
              {promptDialogState.options?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt-input">Значение</Label>
              <Input
                id="prompt-input"
                value={promptDialogState.value}
                onChange={(e) => setPromptValue(e.target.value)}
                placeholder={promptDialogState.options?.placeholder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePromptConfirm()
                  } else if (e.key === 'Escape') {
                    handlePromptCancel()
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handlePromptCancel}>
              {promptDialogState.options?.cancelText || 'Отмена'}
            </Button>
            <Button onClick={handlePromptConfirm}>
              {promptDialogState.options?.confirmText || 'ОК'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}