import { ReactNode } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material'

interface FormDialogShellProps {
  open: boolean
  title: ReactNode
  children: ReactNode
  actions: ReactNode
  onClose: () => void
  isSaving?: boolean
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  onSubmit?: React.FormEventHandler<HTMLFormElement>
}

export function FormDialogShell({
  open,
  title,
  children,
  actions,
  onClose,
  isSaving = false,
  maxWidth = 'md',
  onSubmit,
}: FormDialogShellProps) {
  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth={maxWidth}>
      <Box component="form" noValidate onSubmit={onSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {children}
          </Stack>
        </DialogContent>
        <DialogActions>{actions}</DialogActions>
      </Box>
    </Dialog>
  )
}

export function FormGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
        gap: 2,
      }}
    >
      {children}
    </Box>
  )
}

interface FormDialogActionsProps {
  cancelLabel: string
  saveLabel: string
  isSaving?: boolean
  onCancel: () => void
}

export function FormDialogActions({ cancelLabel, saveLabel, isSaving = false, onCancel }: FormDialogActionsProps) {
  return (
    <>
      <Button onClick={onCancel} disabled={isSaving}>
        {cancelLabel}
      </Button>
      <Button type="submit" variant="contained" disabled={isSaving}>
        {isSaving ? <CircularProgress size={20} color="inherit" /> : saveLabel}
      </Button>
    </>
  )
}
