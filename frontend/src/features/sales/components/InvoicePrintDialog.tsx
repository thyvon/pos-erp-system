'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { invoicePrintApi } from '../api'
import { printInvoice } from '../printInvoice'
import type { Sale } from '@/types/sales'

interface InvoicePrintDialogProps {
  open: boolean
  sale: Sale
  onClose: () => void
}

export function InvoicePrintDialog({ open, sale, onClose }: InvoicePrintDialogProps) {
  const { t } = useTranslation(['sales', 'common'])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const templatesQuery = useQuery({
    queryKey: ['invoice-templates'],
    queryFn: () => invoicePrintApi.getTemplates(),
    enabled: open,
  })

  const templates = templatesQuery.data ?? []
  const activeTemplate = selectedTemplate || templates[0]?.id || ''

  const handleAction = async () => {
    setErrorMessage('')
    setIsProcessing(true)

    try {
      await printInvoice(sale.id, t('print.templateTitle'), t('print.frameUnavailable'), activeTemplate)
      onClose()
    } catch (error) {
      setErrorMessage(toAppApiError(error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('print.templateTitle')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 0.5 }}>
          {errorMessage && (
            <FormHelperText error sx={{ m: 0 }}>
              {errorMessage}
            </FormHelperText>
          )}
          {templatesQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              <FormControl>
                <InputLabel id="invoice-template-label">{t('print.template')}</InputLabel>
                <Select
                  labelId="invoice-template-label"
                  label={t('print.template')}
                  value={activeTemplate}
                  onChange={(event) => setSelectedTemplate(event.target.value)}
                >
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {template.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {template.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{t('print.templateHelp')}</FormHelperText>
              </FormControl>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('print.templateOverrideHelp')}
              </Typography>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isProcessing}>{t('common:buttons.cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleAction}
          disabled={!activeTemplate || templatesQuery.isLoading || isProcessing}
        >
          {isProcessing ? <CircularProgress size={20} /> : t('print.proceed')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
