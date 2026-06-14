'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  cashRegisterKeys,
  useCashRegisterSessionReportQuery,
  useCloseCashRegisterSessionMutation,
} from '../hooks'
import type { CashRegister, CashRegisterSession } from '@/types/sales'

interface CashRegisterSessionDialogProps {
  open: boolean
  register: CashRegister | null
  onClose: () => void
  onClosed: (session: CashRegisterSession) => void
}

function usd(value: string | number | null | undefined) {
  return `USD ${Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function khr(value: string | number | null | undefined) {
  return `KHR ${Number(value ?? 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`
}

export function CashRegisterSessionDialog({
  open,
  register,
  onClose,
  onClosed,
}: CashRegisterSessionDialogProps) {
  const { t } = useTranslation(['sales', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const queryClient = useQueryClient()
  const sessionId = register?.current_open_session?.id ?? null
  const reportQuery = useCashRegisterSessionReportQuery(sessionId, open)
  const closeSession = useCloseCashRegisterSessionMutation()
  const [tab, setTab] = useState<'report' | 'close'>('report')
  const [actualUsd, setActualUsd] = useState('')
  const [actualKhr, setActualKhr] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const handledMissingSessionRef = useRef<string | null>(null)

  const summary = reportQuery.data?.summary
  const expectedUsd = Number(summary?.expected_cash_usd ?? 0)
  const expectedKhr = Number(summary?.expected_cash_khr ?? 0)
  const hasActualUsd = actualUsd !== ''
  const hasActualKhr = actualKhr !== ''
  const actualUsdValue = Number(actualUsd || 0)
  const actualKhrValue = Number(actualKhr || 0)
  const differenceUsd = actualUsdValue - expectedUsd
  const differenceKhr = actualKhrValue - expectedKhr
  const hasDifference = Math.abs(differenceUsd) >= 0.005 || Math.abs(differenceKhr) >= 0.5

  useEffect(() => {
    if (!reportQuery.isError) return

    const error = toAppApiError(reportQuery.error)
    if (error.status !== 404) return
    if (!sessionId || handledMissingSessionRef.current === sessionId) return

    handledMissingSessionRef.current = sessionId
    enqueueSnackbar(error.message, { variant: 'error' })
    void queryClient.invalidateQueries({ queryKey: cashRegisterKeys.all })
    onClose()
  }, [enqueueSnackbar, onClose, queryClient, reportQuery.error, reportQuery.isError, sessionId])

  const closeDialog = () => {
    setTab('report')
    setActualUsd('')
    setActualKhr('')
    setFormError('')
    setConfirmOpen(false)
    onClose()
  }

  const summaryCards = useMemo(
    () => summary
      ? [
          { key: 'opening', label: t('pos.cashRegister.report.openingCash'), usd: summary.opening_cash_usd, khr: summary.opening_cash_khr },
          { key: 'cashSales', label: t('pos.cashRegister.report.cashSales'), usd: summary.cash_sales_usd, khr: summary.cash_sales_khr },
          { key: 'refunds', label: t('pos.cashRegister.report.cashRefunds'), usd: summary.cash_refunds_usd, khr: summary.cash_refunds_khr },
          { key: 'expected', label: t('pos.cashRegister.report.expectedCash'), usd: summary.expected_cash_usd, khr: summary.expected_cash_khr, emphasis: true },
        ]
      : [],
    [summary, t],
  )

  const requestClose = () => {
    setFormError('')

    if (actualUsd === '' || actualKhr === '') {
      setFormError(t('pos.cashRegister.close.actualRequired'))
      return
    }

    if (actualUsdValue < 0 || actualKhrValue < 0) {
      setFormError(t('pos.cashRegister.close.actualNonNegative'))
      return
    }

    setConfirmOpen(true)
  }

  const confirmClose = async () => {
    if (!sessionId) return

    try {
      const session = await closeSession.mutateAsync({
        sessionId,
        payload: {
          closing_cash_usd: actualUsdValue,
          closing_cash_khr: actualKhrValue,
          denominations_at_close: null,
          notes: notes.trim() || null,
        },
      })
      enqueueSnackbar(t('pos.cashRegister.close.closed'), { variant: 'success' })
      setConfirmOpen(false)
      onClosed(session)
    } catch (error) {
      setConfirmOpen(false)
      setFormError(toAppApiError(error).message)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={closeSession.isPending ? undefined : closeDialog} fullWidth maxWidth="md">
        <DialogTitle>
          {t('pos.cashRegister.report.title', { name: register?.name ?? '' })}
        </DialogTitle>
        <Tabs
          value={tab}
          onChange={(_, value: 'report' | 'close') => setTab(value)}
          sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab value="report" label={t('pos.cashRegister.report.tab')} />
          <Tab value="close" label={t('pos.cashRegister.close.tab')} />
        </Tabs>
        <DialogContent sx={{ pt: 2 }}>
          {reportQuery.isLoading && (
            <Box sx={{ minHeight: 280, display: 'grid', placeItems: 'center' }}>
              <CircularProgress />
            </Box>
          )}

          {reportQuery.isError && (
            <Alert severity="error">{toAppApiError(reportQuery.error).message}</Alert>
          )}

          {summary && tab === 'report' && (
            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
                  gap: 1,
                }}
              >
                {summaryCards.map((card) => (
                  <Box
                    key={card.key}
                    sx={{
                      border: 1,
                      borderColor: card.emphasis ? 'success.main' : 'divider',
                      borderRadius: 1,
                      bgcolor: card.emphasis ? 'success.lighter' : 'background.paper',
                      p: 1.5,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>
                      {card.label}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.75, fontWeight: 900 }}>
                      {usd(card.usd)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                      {khr(card.khr)}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                  gap: 1,
                }}
              >
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('pos.cashRegister.report.grossSales')}</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{usd(summary.gross_sales_usd)}</Typography>
                </Box>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('pos.cashRegister.report.salesCount')}</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{summary.sales_count}</Typography>
                </Box>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('pos.cashRegister.report.paymentCount')}</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{summary.payment_count}</Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('pos.cashRegister.report.paymentBreakdown')}</Typography>
                <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('payment.method')}</TableCell>
                        <TableCell align="right">{t('pos.cashRegister.report.transactions')}</TableCell>
                        <TableCell align="right">USD</TableCell>
                        <TableCell align="right">KHR</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.payment_breakdown.map((row) => (
                        <TableRow key={row.method}>
                          <TableCell>{t(`paymentMethods.${row.method}`)}</TableCell>
                          <TableCell align="right">{row.count}</TableCell>
                          <TableCell align="right">{usd(row.amount_usd)}</TableCell>
                          <TableCell align="right">{khr(row.amount_khr)}</TableCell>
                        </TableRow>
                      ))}
                      {summary.payment_breakdown.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            {t('pos.cashRegister.report.noPayments')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Stack>
          )}

          {summary && tab === 'close' && (
            <Stack spacing={2}>
              {formError && <Alert severity="error">{formError}</Alert>}
              <Alert severity="info">{t('pos.cashRegister.close.countPrompt')}</Alert>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                  gap: 1.5,
                }}
              >
                <TextField
                  type="number"
                  label={t('pos.cashRegister.close.actualUsd')}
                  value={actualUsd}
                  onChange={(event) => setActualUsd(event.target.value)}
                  disabled={closeSession.isPending}
                  required
                  slotProps={{
                    htmlInput: { min: 0, step: 0.01 },
                    input: { startAdornment: <InputAdornment position="start">USD</InputAdornment> },
                  }}
                />
                <TextField
                  type="number"
                  label={t('pos.cashRegister.close.actualKhr')}
                  value={actualKhr}
                  onChange={(event) => setActualKhr(event.target.value)}
                  disabled={closeSession.isPending}
                  required
                  slotProps={{
                    htmlInput: { min: 0, step: 100 },
                    input: { startAdornment: <InputAdornment position="start">KHR</InputAdornment> },
                  }}
                />
              </Box>

              <Divider />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                  gap: 1,
                }}
              >
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('pos.cashRegister.close.expectedUsd')}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>{usd(expectedUsd)}</Typography>
                  <Typography variant="body2" sx={{ color: !hasActualUsd ? 'text.secondary' : differenceUsd === 0 ? 'success.main' : differenceUsd > 0 ? 'info.main' : 'error.main', fontWeight: 800 }}>
                    {t('pos.cashRegister.close.difference')}: {hasActualUsd ? usd(differenceUsd) : '-'}
                  </Typography>
                </Box>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('pos.cashRegister.close.expectedKhr')}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>{khr(expectedKhr)}</Typography>
                  <Typography variant="body2" sx={{ color: !hasActualKhr ? 'text.secondary' : differenceKhr === 0 ? 'success.main' : differenceKhr > 0 ? 'info.main' : 'error.main', fontWeight: 800 }}>
                    {t('pos.cashRegister.close.difference')}: {hasActualKhr ? khr(differenceKhr) : '-'}
                  </Typography>
                </Box>
              </Box>

              <TextField
                label={t('pos.cashRegister.close.notes')}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                multiline
                minRows={2}
                disabled={closeSession.isPending}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={closeDialog} disabled={closeSession.isPending}>
            {t('common:buttons.cancel')}
          </Button>
          {tab === 'report' ? (
            <Button variant="contained" onClick={() => setTab('close')} disabled={!summary}>
              {t('pos.cashRegister.close.continue')}
            </Button>
          ) : (
            <Button variant="contained" color="warning" onClick={requestClose} disabled={closeSession.isPending || !summary}>
              {t('pos.cashRegister.close.action')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title={t('pos.cashRegister.close.confirmTitle')}
        message={hasDifference
          ? t('pos.cashRegister.close.confirmDifference', {
              usd: usd(differenceUsd),
              khr: khr(differenceKhr),
            })
          : t('pos.cashRegister.close.confirmBalanced')}
        confirmText={t('pos.cashRegister.close.confirmAction')}
        cancelText={t('common:buttons.cancel')}
        confirmColor="warning"
        loading={closeSession.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void confirmClose()}
      />
    </>
  )
}
