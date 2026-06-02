'use client'

import { Box, Stack, TextField } from '@mui/material'
import { Controller } from 'react-hook-form'
import type { Control, FieldErrors } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { PurchaseFormInput, PurchaseFormValues } from '../schema'

interface PurchaseNotesPanelProps {
  control: Control<PurchaseFormInput, unknown, PurchaseFormValues>
  errors: FieldErrors<PurchaseFormInput>
}

export function PurchaseNotesPanel({ control, errors }: PurchaseNotesPanelProps) {
  const { t } = useTranslation(['purchases'])

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              label={t('form.notes')}
              multiline
              minRows={2}
              error={!!errors.notes}
              helperText={errors.notes?.message}
            />
          )}
        />
        <Controller
          name="staff_note"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              label={t('form.staffNote')}
              multiline
              minRows={2}
              error={!!errors.staff_note}
              helperText={errors.staff_note?.message}
            />
          )}
        />
      </Box>
    </Stack>
  )
}
