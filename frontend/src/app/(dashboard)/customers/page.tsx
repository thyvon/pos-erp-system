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
import {
  Add,
  PeopleOutlined,
} from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useCustomerGroupsQuery } from '@/features/customer-groups/hooks'
import { CustomerFormDialog } from '@/features/customers/CustomerFormDialog'
import { useCustomFieldsQuery } from '@/features/custom-fields/hooks'
import {
  useCreateCustomerMutation,
  useCustomersQuery,
  useDeleteCustomerMutation,
  useUpdateCustomerMutation,
} from '@/features/customers/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { Customer, CustomerFilters, CustomerPayload, CustomerStatus } from '@/types/customer'

const rowsPerPageOptions = [10, 25, 50]

export default function CustomersPage() {
  const { t } = useTranslation(['customers', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CustomerStatus | ''>('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)

  const filters: CustomerFilters = useMemo(
    () => ({
      search: search || undefined,
      status,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search, status]
  )

  const customersQuery = useCustomersQuery(filters)
  const customerGroupsQuery = useCustomerGroupsQuery({ per_page: 100 })
  const customerCustomFieldsQuery = useCustomFieldsQuery({
    module: 'customer',
    per_page: 100,
  })
  const createCustomer = useCreateCustomerMutation()
  const updateCustomer = useUpdateCustomerMutation()
  const deleteCustomer = useDeleteCustomerMutation()

  const customers = customersQuery.data?.data ?? []
  const customerGroups = customerGroupsQuery.data?.data ?? []
  const customerCustomFields = useMemo(
    () =>
      [...(customerCustomFieldsQuery.data?.data ?? [])].sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
        return a.field_label.localeCompare(b.field_label)
      }),
    [customerCustomFieldsQuery.data?.data]
  )
  const meta = customersQuery.data?.meta
  const canCreate = can('customers.create')
  const canEdit = can('customers.edit')
  const canDelete = can('customers.delete')

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

  const columns: EntityTableColumn<Customer>[] = useMemo(
    () => [
      {
        key: 'customer',
        label: t('columns.customer'),
        render: (customer) => (
          <Stack spacing={0.25}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{customer.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {customer.code}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'contact',
        label: t('columns.contact'),
        render: (customer) => (
          <Stack spacing={0.25}>
            <Typography variant="body2">{customer.email || '-'}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {customer.phone || customer.mobile || '-'}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'type',
        label: t('columns.type'),
        render: (customer) => t(`type.${customer.type}`),
      },
      {
        key: 'balance',
        label: t('columns.balance'),
        render: (customer) => new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: 'USD',
        }).format(customer.balance),
      },
      {
        key: 'status',
        label: t('columns.status'),
        render: (customer) => (
          <Chip
            size="small"
            label={t(`common:status.${customer.status}`)}
            color={customer.status === 'active' ? 'success' : 'default'}
          />
        ),
      },
    ],
    [t]
  )

  const openCreateForm = () => {
    setEditingCustomer(null)
    setFormOpen(true)
  }

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: CustomerPayload) => {
    if (editingCustomer) {
      await updateCustomer.mutateAsync({ id: editingCustomer.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createCustomer.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingCustomer) return
    try {
      await deleteCustomer.mutateAsync(deletingCustomer.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingCustomer(null)
    } catch (error) {
      const apiError = toAppApiError(error)
      enqueueSnackbar(apiError.message, { variant: 'error' })
    }
  }

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch)
    setPage(0)
  }

  const handleStatusChange = (nextStatus: CustomerStatus | '') => {
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
            onChange={(event) => handleStatusChange(event.target.value as CustomerStatus | '')}
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

      {customersQuery.isError && (
        <Alert severity="error">
          {toAppApiError(customersQuery.error).message}
        </Alert>
      )}

      {customerCustomFieldsQuery.isError && (
        <Alert severity="warning">
          {toAppApiError(customerCustomFieldsQuery.error).message}
        </Alert>
      )}

      {customerGroupsQuery.isError && (
        <Alert severity="warning">
          {toAppApiError(customerGroupsQuery.error).message}
        </Alert>
      )}

      <EntityTable
        rows={customers}
        columns={columns}
        getRowKey={(customer) => customer.id}
        loading={customersQuery.isLoading}
        emptyIcon={<PeopleOutlined />}
        emptyTitle={t('empty')}
        emptyDescription="Create your first customer or adjust the current filters."
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
        rowActions={(customer) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deleteCustomer.isPending}
            onEdit={() => openEditForm(customer)}
            onDelete={() => setDeletingCustomer(customer)}
          />
        )}
      />

      <CustomerFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingCustomer?.id ?? 'new'}`}
        open={formOpen}
        customer={editingCustomer}
        customerGroups={customerGroups}
        isLoadingCustomerGroups={customerGroupsQuery.isLoading}
        customFields={customerCustomFields}
        isLoadingCustomFields={customerCustomFieldsQuery.isLoading}
        isSaving={createCustomer.isPending || updateCustomer.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingCustomer}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingCustomer?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteCustomer.isPending}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
