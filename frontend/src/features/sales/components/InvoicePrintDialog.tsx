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
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { invoicePrintApi } from '../api'
import type { Sale } from '@/types/sales'

interface InvoicePrintDialogProps {
  open: boolean
  sale: Sale
  onClose: () => void
}

export function InvoicePrintDialog({ open, sale, onClose }: InvoicePrintDialogProps) {
  const { t } = useTranslation(['sales', 'common'])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [printMode, setPrintMode] = useState<'download' | 'preview'>('download')
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

    const previewWindow = printMode === 'preview' ? window.open('', '_blank', 'noopener,noreferrer') : null

    try {
      const blob = printMode === 'download'
        ? await invoicePrintApi.downloadPdf(sale.id, activeTemplate)
        : await invoicePrintApi.viewPdf(sale.id, activeTemplate)
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))

      if (printMode === 'download') {
        const link = document.createElement('a')
        link.href = url
        link.download = `${sale.sale_number.replace(/[\\/]/g, '-')}.pdf`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      } else if (previewWindow) {
        previewWindow.location.href = url
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      }

      onClose()
    } catch (error) {
      previewWindow?.close()
      setErrorMessage(toAppApiError(error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('print.title')}</DialogTitle>
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
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                  {templates.map((tpl) => (
                    <MenuItem key={tpl.id} value={tpl.id}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {tpl.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {tpl.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{t('print.templateHelp')}</FormHelperText>
              </FormControl>

              <RadioGroup
                  value={printMode}
                  onChange={(e) => setPrintMode(e.target.value as 'download' | 'preview')}
                >
                  <FormControlLabel
                    value="download"
                    control={<Radio />}
                    label={<Typography variant="body2">{t('print.download')}</Typography>}
                  />
                  <FormControlLabel
                    value="preview"
                    control={<Radio />}
                    label={<Typography variant="body2">{t('print.preview')}</Typography>}
                  />
                </RadioGroup>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
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
