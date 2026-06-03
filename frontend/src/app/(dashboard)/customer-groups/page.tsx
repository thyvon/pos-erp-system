'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
import { Add, GroupsOutlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
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

const rowsPerPageOptions = [10, 25, 50]

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

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <GroupsOutlined color="primary" />
            <Typography variant="h4">{t('title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('subtitle')}
          </Typography>
        </Box>
        {canCreate && (
          <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
            {t('actions.new')}
          </Button>
        )}
      </Stack>

      <Card>
        <CardContent>
          <TextField
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(0)
            }}
            placeholder={t('filters.search')}
            sx={{ mb: 2.5, width: '100%' }}
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

          {customerGroupsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(customerGroupsQuery.error).message}
            </Alert>
          )}

          {priceGroupsQuery.isError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {toAppApiError(priceGroupsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.name')}</TableCell>
                  <TableCell>{t('columns.discount')}</TableCell>
                  <TableCell>{t('columns.priceGroup')}</TableCell>
                  <TableCell align="center">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customerGroupsQuery.isLoading && <TableStateRow colSpan={4} loading />}

                {!customerGroupsQuery.isLoading && customerGroups.length === 0 && (
                  <TableStateRow colSpan={4} message={t('empty')} />
                )}

                {customerGroups.map((customerGroup) => (
                  <TableRow key={customerGroup.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{customerGroup.name}</Typography>
                    </TableCell>
                    <TableCell>{customerGroup.discount}%</TableCell>
                    <TableCell>{customerGroup.price_group?.name ?? '-'}</TableCell>
                    <TableCell align="center">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteCustomerGroup.isPending}
                        onEdit={() => openEditForm(customerGroup)}
                        onDelete={() => setDeletingCustomerGroup(customerGroup)}
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
      </Card>

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
