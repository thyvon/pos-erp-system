'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  MenuItem,
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
import {
  Add,
  PeopleOutlined,
  Search,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
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
  const customerCustomFieldsQuery = useCustomFieldsQuery({
    module: 'customer',
    per_page: 100,
  })
  const createCustomer = useCreateCustomerMutation()
  const updateCustomer = useUpdateCustomerMutation()
  const deleteCustomer = useDeleteCustomerMutation()

  const customers = customersQuery.data?.data ?? []
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

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <PeopleOutlined color="primary" />
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
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', md: 'center' }, mb: 2.5 }}
          >
            <TextField
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder={t('filters.search')}
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
            <TextField
              select
              value={status}
              onChange={(event) => handleStatusChange(event.target.value as CustomerStatus | '')}
              label={t('filters.status')}
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            >
              <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
              <MenuItem value="active">{t('common:status.active')}</MenuItem>
              <MenuItem value="inactive">{t('common:status.inactive')}</MenuItem>
            </TextField>
          </Stack>

          {customersQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(customersQuery.error).message}
            </Alert>
          )}

          {customerCustomFieldsQuery.isError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {toAppApiError(customerCustomFieldsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.customer')}</TableCell>
                  <TableCell>{t('columns.contact')}</TableCell>
                  <TableCell>{t('columns.type')}</TableCell>
                  <TableCell>{t('columns.balance')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell align="right">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customersQuery.isLoading && (
                  <TableStateRow colSpan={6} loading />
                )}

                {!customersQuery.isLoading && customers.length === 0 && (
                  <TableStateRow colSpan={6} message={t('empty')} />
                )}

                {customers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{customer.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {customer.code}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{customer.email || '-'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {customer.phone || customer.mobile || '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{t(`type.${customer.type}`)}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: 'USD',
                      }).format(customer.balance)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`common:status.${customer.status}`)}
                        color={customer.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteCustomer.isPending}
                        onEdit={() => openEditForm(customer)}
                        onDelete={() => setDeletingCustomer(customer)}
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

      <CustomerFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingCustomer?.id ?? 'new'}`}
        open={formOpen}
        customer={editingCustomer}
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
