'use client'

import { useRef, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  Stack,
  Typography,
} from '@mui/material'
import { FileDownloadOutlined, UploadOutlined } from '@/components/ui/icons'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { productsApi } from '../api'
import type { ImportResult } from '../api'

interface ProductImportDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (result: ImportResult) => void
}

export function ProductImportDialog({ open, onClose, onSuccess }: ProductImportDialogProps) {
  const { t } = useTranslation(['products', 'common'])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState<'standard' | 'variable' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null
    setFile(selected)
    setErrorMessage('')
  }

  const handleDownloadTemplate = async (type: 'standard' | 'variable') => {
    setErrorMessage('')
    setDownloadingTemplate(type)

    try {
      const blob = await productsApi.downloadTemplate(type)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = type === 'variable'
        ? 'variable-product-import-template.xlsx'
        : 'product-import-template.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setErrorMessage(toAppApiError(error).message)
    } finally {
      setDownloadingTemplate(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setErrorMessage('')
    setIsProcessing(true)

    try {
      const result = await productsApi.importProducts(file)
      onSuccess(result)
      onClose()
      setFile(null)
    } catch (error) {
      setErrorMessage(toAppApiError(error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      setFile(null)
      setErrorMessage('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('import.title')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 0.5 }}>
          {errorMessage && (
            <FormHelperText error sx={{ m: 0 }}>
              {errorMessage}
            </FormHelperText>
          )}

          <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                startIcon={downloadingTemplate === 'standard' ? <CircularProgress size={18} /> : <FileDownloadOutlined />}
                onClick={() => handleDownloadTemplate('standard')}
                disabled={downloadingTemplate !== null}
              >
                {t('import.downloadStandardTemplate')}
              </Button>
              <Button
                variant="outlined"
                startIcon={downloadingTemplate === 'variable' ? <CircularProgress size={18} /> : <FileDownloadOutlined />}
                onClick={() => handleDownloadTemplate('variable')}
                disabled={downloadingTemplate !== null}
              >
                {t('import.downloadVariableTemplate')}
              </Button>
            </Stack>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
              {t('import.templateHelp')}
            </Typography>
          </Box>

          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              variant="contained"
              startIcon={<UploadOutlined />}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('import.selectFile')}
            </Button>
            {file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {file.name}
              </Typography>
            )}
          </Box>

          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('import.fileHelp')}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isProcessing}>
          {t('common:buttons.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={!file || isProcessing}
        >
          {isProcessing ? <CircularProgress size={20} /> : t('import.proceed')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
