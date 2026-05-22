'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CardContent,
  Chip,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Add, CompareArrowsOutlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { ExchangeRateFormDialog } from '@/features/accounting/ExchangeRateFormDialog'
import {
  useCreateExchangeRateMutation,
  useDeleteExchangeRateMutation,
  useExchangeRatesQuery,
  useUpdateExchangeRateMutation,
} from '@/features/accounting/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate, formatAppDateTime } from '@/utils/dateFormat'
import type { ExchangeRate, ExchangeRateFilters, ExchangeRatePayload } from '@/types/accounting'

const rowsPerPageOptions = [10, 25, 50]

function formatRate(rate: string | null) {
  return Number(rate ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })
}

export default function ExchangeRatesPage() {
  const { t, i18n } = useTranslation(['accounting', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null)
  const [deletingRate, setDeletingRate] = useState<ExchangeRate | null>(null)
  const dateFormat = useAppDateFormat()

  const filters: ExchangeRateFilters = useMemo(
    () => ({
      search: search || undefined,
      from_currency: 'USD',
      to_currency: 'KHR',
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search],
  )

  const exchangeRatesQuery = useExchangeRatesQuery(filters)
  const createExchangeRate = useCreateExchangeRateMutation()
  const updateExchangeRate = useUpdateExchangeRateMutation()
  const deleteExchangeRate = useDeleteExchangeRateMutation()

  const exchangeRates = exchangeRatesQuery.data?.data ?? []
  const meta = exchangeRatesQuery.data?.meta
  const canManage = can('accounting.index')

  const openCreateForm = () => {
    setEditingRate(null)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: ExchangeRatePayload) => {
    if (editingRate) {
      await updateExchangeRate.mutateAsync({ id: editingRate.id, payload })
      enqueueSnackbar(t('exchangeRates.messages.updated'), { variant: 'success' })
      return
    }

    await createExchangeRate.mutateAsync(payload)
    enqueueSnackbar(t('exchangeRates.messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingRate) return

    try {
      await deleteExchangeRate.mutateAsync(deletingRate.id)
      enqueueSnackbar(t('exchangeRates.messages.deleted'), { variant: 'success' })
      setDeletingRate(null)
    } catch (error) {
      enqueueSnackbar(toAppApiError(error).message, { variant: 'error' })
    }
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CompareArrowsOutlined color="primary" />
            <Typography variant="h4">{t('exchangeRates.title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('exchangeRates.subtitle')}
          </Typography>
        </Box>
        {canManage && (
          <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
            {t('exchangeRates.actions.new')}
          </Button>
        )}
      </Stack>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', lg: 'center' }, mb: 2.5 }}
          >
            <TextField
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
              placeholder={t('exchangeRates.filters.search')}
              sx={{ flexGrow: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>

          {exchangeRatesQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(exchangeRatesQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('exchangeRates.columns.pair')}</TableCell>
                  <TableCell align="right">{t('exchangeRates.columns.rate')}</TableCell>
                  <TableCell>{t('exchangeRates.columns.effectiveDate')}</TableCell>
                  <TableCell>{t('exchangeRates.columns.status')}</TableCell>
                  <TableCell>{t('exchangeRates.columns.updatedAt')}</TableCell>
                  <TableCell align="right">{t('exchangeRates.columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exchangeRatesQuery.isLoading && <TableStateRow colSpan={6} loading />}
                {!exchangeRatesQuery.isLoading && exchangeRates.length === 0 && (
                  <TableStateRow colSpan={6} message={t('exchangeRates.empty')} />
                )}
                {exchangeRates.map((rate) => (
                  <TableRow key={rate.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {rate.from_currency} / {rate.to_currency}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('exchangeRates.labels.rateText', {
                          from: rate.from_currency,
                          to: rate.to_currency,
                          rate: formatRate(rate.rate),
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{formatRate(rate.rate)}</TableCell>
                    <TableCell>{formatAppDate(rate.effective_date, dateFormat, i18n.language)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={rate.is_default ? t('exchangeRates.statuses.default') : t('exchangeRates.statuses.history')}
                        color={rate.is_default ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatAppDateTime(rate.updated_at, dateFormat, i18n.language)}</TableCell>
                    <TableCell align="right">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canManage}
                        showDelete={canManage}
                        deleteDisabled={deleteExchangeRate.isPending}
                        onEdit={() => {
                          setEditingRate(rate)
                          setFormOpen(true)
                        }}
                        onDelete={() => setDeletingRate(rate)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={meta?.total ?? 0}
            page={page}
            rowsPerPage={perPage}
            rowsPerPageOptions={rowsPerPageOptions}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={(event) => {
              setPerPage(Number(event.target.value))
              setPage(0)
            }}
          />
        </CardContent>
      </Box>

      <ExchangeRateFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingRate?.id ?? 'new'}`}
        open={formOpen}
        exchangeRate={editingRate}
        isSaving={createExchangeRate.isPending || updateExchangeRate.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingRate}
        title={t('exchangeRates.deleteDialog.title')}
        message={t('exchangeRates.deleteDialog.message', {
          pair: deletingRate ? `${deletingRate.from_currency}/${deletingRate.to_currency}` : '',
        })}
        confirmText={t('exchangeRates.deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteExchangeRate.isPending}
        onClose={() => setDeletingRate(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
