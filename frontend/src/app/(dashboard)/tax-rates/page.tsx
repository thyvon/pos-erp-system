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
import { Add, PercentOutlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { TaxRateFormDialog } from '@/features/tax-rates/TaxRateFormDialog'
import {
  useCreateTaxRateMutation,
  useDeleteTaxRateMutation,
  useTaxRatesQuery,
  useUpdateTaxRateMutation,
} from '@/features/tax-rates/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { TaxRate, TaxRateFilters, TaxRatePayload, TaxRateType } from '@/types/taxRate'

const rowsPerPageOptions = [10, 25, 50]
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

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <PercentOutlined color="primary" />
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
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value as TaxRateFilters['type'])
                setPage(0)
              }}
              label={t('filters.type')}
              sx={{ minWidth: { xs: '100%', md: 180 } }}
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
              sx={{ minWidth: { xs: '100%', md: 180 } }}
            >
              <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
              <MenuItem value="true">{t('common:status.active')}</MenuItem>
              <MenuItem value="false">{t('common:status.inactive')}</MenuItem>
            </TextField>
          </Stack>

          {taxRatesQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(taxRatesQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.name')}</TableCell>
                  <TableCell>{t('columns.type')}</TableCell>
                  <TableCell>{t('columns.rate')}</TableCell>
                  <TableCell>{t('columns.default')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell align="right">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {taxRatesQuery.isLoading && <TableStateRow colSpan={6} loading />}

                {!taxRatesQuery.isLoading && taxRates.length === 0 && (
                  <TableStateRow colSpan={6} message={t('empty')} />
                )}

                {taxRates.map((taxRate) => (
                  <TableRow key={taxRate.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{taxRate.name}</Typography>
                    </TableCell>
                    <TableCell>{t(`type.${taxRate.type}`)}</TableCell>
                    <TableCell>{formatRate(taxRate)}</TableCell>
                    <TableCell>
                      {taxRate.is_default ? (
                        <Chip size="small" color="primary" label={t('badges.default')} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={taxRate.is_active ? t('common:status.active') : t('common:status.inactive')}
                        color={taxRate.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteTaxRate.isPending}
                        onEdit={() => openEditForm(taxRate)}
                        onDelete={() => setDeletingTaxRate(taxRate)}
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
