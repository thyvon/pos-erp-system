'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Stack,
  Typography,
} from '@mui/material'
import { Add, GroupsOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { CustomerGroupFormDialog } from '@/features/customer-groups/CustomerGroupFormDialog'
import {
  useCreateCustomerGroupMutation,
  useCustomerGroupsQuery,
  useDeleteCustomerGroupMutation,
  useUpdateCustomerGroupMutation,
} from '@/features/customer-groups/hooks'
import { usePriceGroupsQuery } from '@/features/price-groups/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { CustomerGroup, CustomerGroupFilters, CustomerGroupPayload } from '@/types/customerGroup'

export default function CustomerGroupsPage() {
  const { t } = useTranslation(['customerGroups', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomerGroup, setEditingCustomerGroup] = useState<CustomerGroup | null>(null)
  const [deletingCustomerGroup, setDeletingCustomerGroup] = useState<CustomerGroup | null>(null)

  const filters: CustomerGroupFilters = useMemo(
    () => ({
      search: search || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search]
  )

  const customerGroupsQuery = useCustomerGroupsQuery(filters)
  const priceGroupsQuery = usePriceGroupsQuery({ per_page: 100 })
  const createCustomerGroup = useCreateCustomerGroupMutation()
  const updateCustomerGroup = useUpdateCustomerGroupMutation()
  const deleteCustomerGroup = useDeleteCustomerGroupMutation()

  const customerGroups = customerGroupsQuery.data?.data ?? []
  const priceGroups = priceGroupsQuery.data?.data ?? []
  const meta = customerGroupsQuery.data?.meta
  const canCreate = can('customer_groups.create')
  const canEdit = can('customer_groups.edit')
  const canDelete = can('customer_groups.delete')

  const openCreateForm = () => {
    setEditingCustomerGroup(null)
    setFormOpen(true)
  }

  const openEditForm = (customerGroup: CustomerGroup) => {
    setEditingCustomerGroup(customerGroup)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: CustomerGroupPayload) => {
    if (editingCustomerGroup) {
      await updateCustomerGroup.mutateAsync({ id: editingCustomerGroup.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createCustomerGroup.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingCustomerGroup) return

    try {
      await deleteCustomerGroup.mutateAsync(deletingCustomerGroup.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingCustomerGroup(null)
    } catch (error) {
      const apiError = toAppApiError(error)
      enqueueSnackbar(apiError.message, { variant: 'error' })
    }
  }

  const columns: EntityTableColumn<CustomerGroup>[] = useMemo(
    () => [
      {
        key: 'name',
        label: t('columns.name'),
        render: (customerGroup) => (
          <Typography variant="subtitle2">{customerGroup.name}</Typography>
        ),
      },
      {
        key: 'discount',
        label: t('columns.discount'),
        render: (customerGroup) => `${customerGroup.discount}%`,
      },
      {
        key: 'priceGroup',
        label: t('columns.priceGroup'),
        render: (customerGroup) => customerGroup.price_group?.name ?? '-',
      },
    ],
    [t]
  )

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<GroupsOutlined color="primary" />}
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
      />

      {customerGroupsQuery.isError && (
        <Alert severity="error">{toAppApiError(customerGroupsQuery.error).message}</Alert>
      )}

      {priceGroupsQuery.isError && (
        <Alert severity="warning">{toAppApiError(priceGroupsQuery.error).message}</Alert>
      )}

      <EntityTable
        rows={customerGroups}
        columns={columns}
        getRowKey={(customerGroup) => customerGroup.id}
        loading={customerGroupsQuery.isLoading}
        emptyIcon={<GroupsOutlined />}
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
        rowActions={(customerGroup) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deleteCustomerGroup.isPending}
            onEdit={() => openEditForm(customerGroup)}
            onDelete={() => setDeletingCustomerGroup(customerGroup)}
          />
        )}
      />

      <CustomerGroupFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingCustomerGroup?.id ?? 'new'}`}
        open={formOpen}
        customerGroup={editingCustomerGroup}
        priceGroups={priceGroups}
        isLoadingPriceGroups={priceGroupsQuery.isLoading}
        isSaving={createCustomerGroup.isPending || updateCustomerGroup.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingCustomerGroup}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingCustomerGroup?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteCustomerGroup.isPending}
        onClose={() => setDeletingCustomerGroup(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
