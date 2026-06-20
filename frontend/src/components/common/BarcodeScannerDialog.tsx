'use client'

import { useEffect, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { Html5Qrcode } from 'html5-qrcode'
import { Close } from '@/components/ui/icons'

interface BarcodeScannerDialogProps {
  open: boolean
  onClose: () => void
  onScan: (code: string) => void
}

const CONTAINER_ID = 'barcode-scanner-container'

export function BarcodeScannerDialog({ open, onClose, onScan }: BarcodeScannerDialogProps) {
  const { t } = useTranslation('inventory')
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    if (!open) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
      return
    }

    let cancelled = false
    let scanner: Html5Qrcode | null = null

    void (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')

        if (cancelled) return

        scanner = new Html5Qrcode(CONTAINER_ID)

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText: string) => {
            scanner?.stop().catch(() => {})
            scannerRef.current = null
            onScan(decodedText)
            onClose()
          },
          () => {},
        )

        if (cancelled) {
          scanner.stop().catch(() => {})
          return
        }

        scannerRef.current = scanner
      } catch {
        scannerRef.current = null
      }
    })()

    return () => {
      cancelled = true
      const activeScanner = scannerRef.current ?? scanner
      activeScanner?.stop().catch(() => {})
      scannerRef.current = null
    }
  }, [open, onScan, onClose])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        {t('lookup.scannerTitle')}
      </DialogTitle>
      <IconButton
        onClick={onClose}
        sx={{ position: 'absolute', right: 8, top: 8 }}
      >
        <Close />
      </IconButton>
      <DialogContent>
        <Box
          id={CONTAINER_ID}
          sx={{
            width: '100%',
            minHeight: 300,
            '& video': { borderRadius: 1 },
          }}
        />
        <Typography
          variant="caption"
          sx={{ display: 'block', textAlign: 'center', mt: 1, color: 'text.secondary' }}
        >
          {t('lookup.scannerHelp')}
        </Typography>
      </DialogContent>
    </Dialog>
  )
}
