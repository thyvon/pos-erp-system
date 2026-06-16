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
import { Add, CalculateOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TaxGroupFormDialog } from '@/features/tax-groups/TaxGroupFormDialog'
import {
  useCreateTaxGroupMutation,
  useDeleteTaxGroupMutation,
  useTaxGroupsQuery,
  useUpdateTaxGroupMutation,
} from '@/features/tax-groups/hooks'
import { useTaxRatesQuery } from '@/features/tax-rates/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { TaxGroup, TaxGroupFilters, TaxGroupPayload } from '@/types/taxGroup'

function formatTaxRate(rate: number, type: string) {
  return type === 'percentage' ? `${rate}%` : rate.toFixed(2)
}

export default function TaxGroupsPage() {
  const { t } = useTranslation(['taxGroups', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaxGroupFilters['is_active']>('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTaxGroup, setEditingTaxGroup] = useState<TaxGroup | null>(null)
  const [deletingTaxGroup, setDeletingTaxGroup] = useState<TaxGroup | null>(null)

  const filters: TaxGroupFilters = useMemo(
    () => ({
      search: search || undefined,
      is_active: statusFilter,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search, statusFilter]
  )

  const taxGroupsQuery = useTaxGroupsQuery(filters)
  const taxRatesQuery = useTaxRatesQuery({ is_active: true, per_page: 100 })
  const createTaxGroup = useCreateTaxGroupMutation()
  const updateTaxGroup = useUpdateTaxGroupMutation()
  const deleteTaxGroup = useDeleteTaxGroupMutation()

  const taxGroups = taxGroupsQuery.data?.data ?? []
  const taxRates = taxRatesQuery.data?.data ?? []
  const meta = taxGroupsQuery.data?.meta
  const canCreate = can('tax_groups.create')
  const canEdit = can('tax_groups.edit')
  const canDelete = can('tax_groups.delete')

  const openCreateForm = () => {
    setEditingTaxGroup(null)
    setFormOpen(true)
  }

  const openEditForm = (taxGroup: TaxGroup) => {
    setEditingTaxGroup(taxGroup)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: TaxGroupPayload) => {
    if (editingTaxGroup) {
      await updateTaxGroup.mutateAsync({ id: editingTaxGroup.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createTaxGroup.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingTaxGroup) return

    try {
      await deleteTaxGroup.mutateAsync(deletingTaxGroup.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingTaxGroup(null)
    } catch (error) {
      const apiError = toAppApiError(error)
      enqueueSnackbar(apiError.message, { variant: 'error' })
    }
  }

  const activeFilters = useMemo(() => {
    const items: Array<{ key: string; label: string; onDelete: () => void }> = []

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
  }, [statusFilter, t])

  const clearFilters = () => {
    setStatusFilter('')
    setPage(0)
  }

  const columns: EntityTableColumn<TaxGroup>[] = useMemo(
    () => [
      {
        key: 'name',
        label: t('columns.name'),
        render: (taxGroup) => (
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">{taxGroup.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('badges.rateCount', { count: taxGroup.tax_rate_count })}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'taxRates',
        label: t('columns.taxRates'),
        render: (taxGroup) => (
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            {taxGroup.tax_rates.map((taxRate) => (
              <Chip
                key={taxRate.id}
                size="small"
                label={`${taxRate.name} (${formatTaxRate(taxRate.rate, taxRate.type)})`}
              />
            ))}
          </Stack>
        ),
      },
      {
        key: 'description',
        label: t('columns.description'),
        render: (taxGroup) => taxGroup.description || '-',
      },
      {
        key: 'status',
        label: t('columns.status'),
        render: (taxGroup) => (
          <Chip
            size="small"
            label={taxGroup.is_active ? t('common:status.active') : t('common:status.inactive')}
            color={taxGroup.is_active ? 'success' : 'default'}
          />
        ),
      },
    ],
    [t]
  )

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<CalculateOutlined color="primary" />}
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
        }
        activeFilters={activeFilters}
        onClearFilters={activeFilters.length > 0 ? clearFilters : undefined}
      />

      {taxGroupsQuery.isError && (
        <Alert severity="error">{toAppApiError(taxGroupsQuery.error).message}</Alert>
      )}

      {taxRatesQuery.isError && (
        <Alert severity="warning">{toAppApiError(taxRatesQuery.error).message}</Alert>
      )}

      <EntityTable
        rows={taxGroups}
        columns={columns}
        getRowKey={(taxGroup) => taxGroup.id}
        loading={taxGroupsQuery.isLoading}
        emptyIcon={<CalculateOutlined />}
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
        rowActions={(taxGroup) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deleteTaxGroup.isPending}
            onEdit={() => openEditForm(taxGroup)}
            onDelete={() => setDeletingTaxGroup(taxGroup)}
          />
        )}
      />

      <TaxGroupFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingTaxGroup?.id ?? 'new'}`}
        open={formOpen}
        taxGroup={editingTaxGroup}
        taxRates={taxRates}
        taxRatesLoading={taxRatesQuery.isLoading}
        isSaving={createTaxGroup.isPending || updateTaxGroup.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingTaxGroup}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingTaxGroup?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteTaxGroup.isPending}
        onClose={() => setDeletingTaxGroup(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
