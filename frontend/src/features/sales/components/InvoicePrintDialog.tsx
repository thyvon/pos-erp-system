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

  const templatesQuery = useQuery({
    queryKey: ['invoice-templates'],
    queryFn: () => invoicePrintApi.getTemplates(),
    enabled: open,
  })

  const templates = templatesQuery.data?.data ?? []
  const activeTemplate = selectedTemplate || templates[0]?.id || ''

  const handleAction = () => {
    if (printMode === 'download') {
      window.open(invoicePrintApi.downloadUrl(sale.id, activeTemplate), '_blank')
    } else {
      window.open(invoicePrintApi.viewUrl(sale.id, activeTemplate), '_blank')
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('print.title')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 0.5 }}>
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
        <Button onClick={onClose}>{t('common:buttons.cancel')}</Button>
        <Button variant="contained" onClick={handleAction} disabled={!activeTemplate || templatesQuery.isLoading}>
          {t('print.proceed')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
