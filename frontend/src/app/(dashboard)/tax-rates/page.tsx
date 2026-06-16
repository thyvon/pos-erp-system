'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Add, PercentOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TaxRateFormDialog } from '@/features/tax-rates/TaxRateFormDialog'
import {
  useCreateTaxRateMutation,
  useDeleteTaxRateMutation,
  useTaxRatesQuery,
  useUpdateTaxRateMutation,
} from '@/features/tax-rates/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { TaxRate, TaxRateFilters, TaxRatePayload, TaxRateType } from '@/types/taxRate'

const taxRateTypes: TaxRateType[] = ['percentage', 'fixed']

function formatRate(taxRate: TaxRate) {
  if (taxRate.type === 'percentage') return `${taxRate.rate}%`

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(taxRate.rate)
}

export default function TaxRatesPage() {
  const { t } = useTranslation(['taxRates', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TaxRateFilters['type']>('')
  const [statusFilter, setStatusFilter] = useState<TaxRateFilters['is_active']>('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null>(null)
  const [deletingTaxRate, setDeletingTaxRate] = useState<TaxRate | null>(null)

  const filters: TaxRateFilters = useMemo(
    () => ({
      search: search || undefined,
      type: typeFilter,
      is_active: statusFilter,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search, statusFilter, typeFilter]
  )

  const taxRatesQuery = useTaxRatesQuery(filters)
  const createTaxRate = useCreateTaxRateMutation()
  const updateTaxRate = useUpdateTaxRateMutation()
  const deleteTaxRate = useDeleteTaxRateMutation()

  const taxRates = taxRatesQuery.data?.data ?? []
  const meta = taxRatesQuery.data?.meta
  const canCreate = can('tax_rates.create')
  const canEdit = can('tax_rates.edit')
  const canDelete = can('tax_rates.delete')

  const openCreateForm = () => {
    setEditingTaxRate(null)
    setFormOpen(true)
  }

  const openEditForm = (taxRate: TaxRate) => {
    setEditingTaxRate(taxRate)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: TaxRatePayload) => {
    if (editingTaxRate) {
      await updateTaxRate.mutateAsync({ id: editingTaxRate.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createTaxRate.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingTaxRate) return

    try {
      await deleteTaxRate.mutateAsync(deletingTaxRate.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingTaxRate(null)
    } catch (error) {
      const apiError = toAppApiError(error)
      enqueueSnackbar(apiError.message, { variant: 'error' })
    }
  }

  const activeFilters = useMemo(() => {
    const items: Array<{ key: string; label: string; onDelete: () => void }> = []

    if (typeFilter) {
      items.push({
        key: 'type',
        label: `${t('filters.type')}: ${t(`type.${typeFilter}`)}`,
        onDelete: () => {
          setTypeFilter('')
          setPage(0)
        },
      })
    }

    if (statusFilter !== '') {
      items.push({
        key: 'status',
        label: `${t('filters.status')}: ${statusFilter ? t('common:status.active') : t('common:status.inactive')}`,
        onDelete: () => {
          setStatusFilter('')
          setPage(0)
        },
      })
    }

    return items
  }, [statusFilter, t, typeFilter])

  const clearFilters = () => {
    setTypeFilter('')
    setStatusFilter('')
    setPage(0)
  }

  const columns: EntityTableColumn<TaxRate>[] = useMemo(
    () => [
      {
        key: 'name',
        label: t('columns.name'),
        render: (taxRate) => (
          <Typography variant="subtitle2">{taxRate.name}</Typography>
        ),
      },
      {
        key: 'type',
        label: t('columns.type'),
        render: (taxRate) => t(`type.${taxRate.type}`),
      },
      {
        key: 'rate',
        label: t('columns.rate'),
        render: (taxRate) => formatRate(taxRate),
      },
      {
        key: 'default',
        label: t('columns.default'),
        render: (taxRate) =>
          taxRate.is_default ? (
            <Chip size="small" color="primary" label={t('badges.default')} />
          ) : (
            '-'
          ),
      },
      {
        key: 'status',
        label: t('columns.status'),
        render: (taxRate) => (
          <Chip
            size="small"
            label={taxRate.is_active ? t('common:status.active') : t('common:status.inactive')}
            color={taxRate.is_active ? 'success' : 'default'}
          />
        ),
      },
    ],
    [t]
  )

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<PercentOutlined color="primary" />}
        title={t('title')}
        description={t('subtitle')}
        actions={canCreate && (
          <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
            {t('actions.new')}
          </Button>
        )}
      />

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('filters.search')}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(0)
        }}
        filters={
          <>
            <TextField
              select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value as TaxRateFilters['type'])
                setPage(0)
              }}
              label={t('filters.type')}
            >
              <MenuItem value="">{t('filters.allTypes')}</MenuItem>
              {taxRateTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {t(`type.${type}`)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              value={statusFilter === '' ? '' : String(statusFilter)}
              onChange={(event) => {
                const value = event.target.value
                setStatusFilter(value === '' ? '' : value === 'true')
                setPage(0)
              }}
              label={t('filters.status')}
            >
              <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
              <MenuItem value="true">{t('common:status.active')}</MenuItem>
              <MenuItem value="false">{t('common:status.inactive')}</MenuItem>
            </TextField>
          </>
        }
        activeFilters={activeFilters}
        onClearFilters={activeFilters.length > 0 ? clearFilters : undefined}
      />

      {taxRatesQuery.isError && (
        <Alert severity="error">{toAppApiError(taxRatesQuery.error).message}</Alert>
      )}

      <EntityTable
        rows={taxRates}
        columns={columns}
        getRowKey={(taxRate) => taxRate.id}
        loading={taxRatesQuery.isLoading}
        emptyIcon={<PercentOutlined />}
        emptyTitle={t('empty')}
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
        rowActions={(taxRate) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deleteTaxRate.isPending}
            onEdit={() => openEditForm(taxRate)}
            onDelete={() => setDeletingTaxRate(taxRate)}
          />
        )}
      />

      <TaxRateFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingTaxRate?.id ?? 'new'}`}
        open={formOpen}
        taxRate={editingTaxRate}
        isSaving={createTaxRate.isPending || updateTaxRate.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingTaxRate}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingTaxRate?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteTaxRate.isPending}
        onClose={() => setDeletingTaxRate(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
