'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import { Add, CompareArrowsOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
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

  const columns: EntityTableColumn<ExchangeRate>[] = useMemo(
    () => [
      {
        key: 'pair',
        label: t('exchangeRates.columns.pair'),
        render: (rate) => (
          <>
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
          </>
        ),
      },
      {
        key: 'rate',
        label: t('exchangeRates.columns.rate'),
        align: 'right',
        render: (rate) => formatRate(rate.rate),
      },
      {
        key: 'effectiveDate',
        label: t('exchangeRates.columns.effectiveDate'),
        render: (rate) => formatAppDate(rate.effective_date, dateFormat, i18n.language),
      },
      {
        key: 'status',
        label: t('exchangeRates.columns.status'),
        render: (rate) => (
          <Chip
            size="small"
            label={rate.is_default ? t('exchangeRates.statuses.default') : t('exchangeRates.statuses.history')}
            color={rate.is_default ? 'success' : 'default'}
            variant="outlined"
          />
        ),
      },
      {
        key: 'updatedAt',
        label: t('exchangeRates.columns.updatedAt'),
        render: (rate) => formatAppDateTime(rate.updated_at, dateFormat, i18n.language),
      },
    ],
    [t, dateFormat, i18n.language]
  )

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
    <Stack spacing={2.5}>
      <PageHeader
        icon={<CompareArrowsOutlined color="primary" />}
        title={t('exchangeRates.title')}
        description={t('exchangeRates.subtitle')}
        actions={canManage && (
          <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
            {t('exchangeRates.actions.new')}
          </Button>
        )}
      />

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('exchangeRates.filters.search')}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(0)
        }}
      />

      {exchangeRatesQuery.isError && (
        <Alert severity="error">
          {toAppApiError(exchangeRatesQuery.error).message}
        </Alert>
      )}

      <EntityTable
        rows={exchangeRates}
        columns={columns}
        getRowKey={(rate) => rate.id}
        loading={exchangeRatesQuery.isLoading}
        emptyIcon={<CompareArrowsOutlined />}
        emptyTitle={t('exchangeRates.empty')}
        pagination={{
          page,
          rowsPerPage: perPage,
          count: meta?.total ?? 0,
          onPageChange: setPage,
          onRowsPerPageChange: (nextPerPage) => {
            setPerPage(nextPerPage)
            setPage(0)
          },
        }}
        rowActions={(rate) => (
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
        )}
      />

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
