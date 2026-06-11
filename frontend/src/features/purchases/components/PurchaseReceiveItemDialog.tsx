'use client'

import { useTranslation } from 'react-i18next'
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, type Control, type FieldErrors } from 'react-hook-form'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import type { ReceivePurchaseFormInput } from '../schema'

interface ReceiveItemDetailDialogProps {
  open: boolean
  index: number
  productLabel: string
  sku: string | null | undefined
  stockTracking: string | null | undefined
  hasExpiry: boolean | undefined
  control: Control<ReceivePurchaseFormInput>
  errors: FieldErrors<ReceivePurchaseFormInput>
  onClose: () => void
}

export function PurchaseReceiveItemDialog({
  open,
  index,
  productLabel,
  sku,
  stockTracking,
  hasExpiry,
  control,
  errors,
  onClose,
}: ReceiveItemDetailDialogProps) {
  const { t } = useTranslation(['purchases', 'common'])
  const showLotFields = stockTracking === 'lot' || hasExpiry

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack spacing={0.25}>
          <Typography variant="h6">{productLabel}</Typography>
          {sku && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{sku}</Typography>}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {showLotFields && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Controller
                name={`items.${index}.manufacture_date`}
                control={control}
                render={({ field }) => (
                  <AppDatePicker
                    label={t('receive.manufactureDate')}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                name={`items.${index}.expiry_date`}
                control={control}
                render={({ field }) => (
                  <AppDatePicker
                    label={t('receive.expiryDate')}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
              {stockTracking === 'lot' && (
                <Controller
                  name={`items.${index}.warranty_expires`}
                  control={control}
                  render={({ field }) => (
                    <AppDatePicker
                      label={t('receive.warrantyExpires')}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              )}
            </Box>
          )}
          <Controller
            name={`items.${index}.notes`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                multiline
                minRows={2}
                maxRows={4}
                label={t('receive.notes')}
                error={!!errors.items?.[index]?.notes}
                helperText={errors.items?.[index]?.notes?.message}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          {t('common:buttons.close')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
