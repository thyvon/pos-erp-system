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
import { Add, LocalShippingOutlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
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

const rowsPerPageOptions = [10, 25, 50]

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

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <LocalShippingOutlined color="primary" />
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
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
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
              onChange={(event) => {
                setStatus(event.target.value as SupplierStatus | '')
                setPage(0)
              }}
              label={t('filters.status')}
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            >
              <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
              <MenuItem value="active">{t('common:status.active')}</MenuItem>
              <MenuItem value="inactive">{t('common:status.inactive')}</MenuItem>
            </TextField>
          </Stack>

          {suppliersQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(suppliersQuery.error).message}
            </Alert>
          )}

          {supplierCustomFieldsQuery.isError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {toAppApiError(supplierCustomFieldsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.supplier')}</TableCell>
                  <TableCell>{t('columns.contact')}</TableCell>
                  <TableCell>{t('columns.company')}</TableCell>
                  <TableCell>{t('columns.balance')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell align="center">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliersQuery.isLoading && <TableStateRow colSpan={6} loading />}

                {!suppliersQuery.isLoading && suppliers.length === 0 && (
                  <TableStateRow colSpan={6} message={t('empty')} />
                )}

                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{supplier.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {supplier.code}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{supplier.email || '-'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {supplier.phone || supplier.mobile || '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{supplier.company || '-'}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: 'USD',
                      }).format(supplier.balance)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`common:status.${supplier.status}`)}
                        color={supplier.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteSupplier.isPending}
                        onEdit={() => openEditForm(supplier)}
                        onDelete={() => setDeletingSupplier(supplier)}
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
