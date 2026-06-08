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
import { Add, LocalShippingOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useCustomFieldsQuery } from '@/features/custom-fields/hooks'
import { SupplierFormDialog } from '@/features/suppliers/SupplierFormDialog'
import {
  useCreateSupplierMutation,
  useDeleteSupplierMutation,
  useSuppliersQuery,
  useUpdateSupplierMutation,
} from '@/features/suppliers/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { Supplier, SupplierFilters, SupplierPayload, SupplierStatus } from '@/types/supplier'

export default function SuppliersPage() {
  const { t } = useTranslation(['suppliers', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<SupplierStatus | ''>('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)

  const filters: SupplierFilters = useMemo(
    () => ({
      search: search || undefined,
      status,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search, status]
  )

  const suppliersQuery = useSuppliersQuery(filters)
  const supplierCustomFieldsQuery = useCustomFieldsQuery({
    module: 'supplier',
    per_page: 100,
  })
  const createSupplier = useCreateSupplierMutation()
  const updateSupplier = useUpdateSupplierMutation()
  const deleteSupplier = useDeleteSupplierMutation()

  const suppliers = suppliersQuery.data?.data ?? []
  const supplierCustomFields = useMemo(
    () =>
      [...(supplierCustomFieldsQuery.data?.data ?? [])].sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
        return a.field_label.localeCompare(b.field_label)
      }),
    [supplierCustomFieldsQuery.data?.data]
  )
  const meta = suppliersQuery.data?.meta
  const canCreate = can('suppliers.create')
  const canEdit = can('suppliers.edit')
  const canDelete = can('suppliers.delete')

  const activeFilters = useMemo(() => {
    if (!status) return []

    return [
      {
        key: 'status',
        label: `${t('filters.status')}: ${t(`common:status.${status}`)}`,
        onDelete: () => {
          setStatus('')
          setPage(0)
        },
      },
    ]
  }, [status, t])

  const columns: EntityTableColumn<Supplier>[] = useMemo(
    () => [
      {
        key: 'supplier',
        label: t('columns.supplier'),
        render: (supplier) => (
          <Stack spacing={0.25}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{supplier.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {supplier.code}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'contact',
        label: t('columns.contact'),
        render: (supplier) => (
          <Stack spacing={0.25}>
            <Typography variant="body2">{supplier.email || '-'}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {supplier.phone || supplier.mobile || '-'}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'company',
        label: t('columns.company'),
        render: (supplier) => supplier.company || '-',
      },
      {
        key: 'balance',
        label: t('columns.balance'),
        render: (supplier) => new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: 'USD',
        }).format(supplier.balance),
      },
      {
        key: 'status',
        label: t('columns.status'),
        render: (supplier) => (
          <Chip
            size="small"
            label={t(`common:status.${supplier.status}`)}
            color={supplier.status === 'active' ? 'success' : 'default'}
          />
        ),
      },
    ],
    [t]
  )

  const openCreateForm = () => {
    setEditingSupplier(null)
    setFormOpen(true)
  }

  const openEditForm = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: SupplierPayload) => {
    if (editingSupplier) {
      await updateSupplier.mutateAsync({ id: editingSupplier.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createSupplier.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingSupplier) return

    try {
      await deleteSupplier.mutateAsync(deletingSupplier.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingSupplier(null)
    } catch (error) {
      const apiError = toAppApiError(error)
      enqueueSnackbar(apiError.message, { variant: 'error' })
    }
  }

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch)
    setPage(0)
  }

  const handleStatusChange = (nextStatus: SupplierStatus | '') => {
    setStatus(nextStatus)
    setPage(0)
  }

  const clearFilters = () => {
    setStatus('')
    setPage(0)
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        eyebrow="Contacts"
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
        onSearchChange={handleSearchChange}
        filters={
          <TextField
            select
            value={status}
            onChange={(event) => handleStatusChange(event.target.value as SupplierStatus | '')}
            label={t('filters.status')}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
            <MenuItem value="active">{t('common:status.active')}</MenuItem>
            <MenuItem value="inactive">{t('common:status.inactive')}</MenuItem>
          </TextField>
        }
        activeFilters={activeFilters}
        onClearFilters={activeFilters.length > 0 ? clearFilters : undefined}
      />

      {suppliersQuery.isError && (
        <Alert severity="error">
          {toAppApiError(suppliersQuery.error).message}
        </Alert>
      )}

      {supplierCustomFieldsQuery.isError && (
        <Alert severity="warning">
          {toAppApiError(supplierCustomFieldsQuery.error).message}
        </Alert>
      )}

      <EntityTable
        rows={suppliers}
        columns={columns}
        getRowKey={(supplier) => supplier.id}
        loading={suppliersQuery.isLoading}
        emptyIcon={<LocalShippingOutlined />}
        emptyTitle={t('empty')}
        emptyDescription="Create your first supplier or adjust the current filters."
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
        rowActions={(supplier) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deleteSupplier.isPending}
            onEdit={() => openEditForm(supplier)}
            onDelete={() => setDeletingSupplier(supplier)}
          />
        )}
      />

      <SupplierFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingSupplier?.id ?? 'new'}`}
        open={formOpen}
        supplier={editingSupplier}
        customFields={supplierCustomFields}
        isLoadingCustomFields={supplierCustomFieldsQuery.isLoading}
        isSaving={createSupplier.isPending || updateSupplier.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingSupplier}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingSupplier?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteSupplier.isPending}
        onClose={() => setDeletingSupplier(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
