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
import { Add, CalculateOutlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
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

const rowsPerPageOptions = [10, 25, 50]

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

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CalculateOutlined color="primary" />
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

          {taxGroupsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(taxGroupsQuery.error).message}
            </Alert>
          )}

          {taxRatesQuery.isError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {toAppApiError(taxRatesQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.name')}</TableCell>
                  <TableCell>{t('columns.taxRates')}</TableCell>
                  <TableCell>{t('columns.description')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell align="center">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {taxGroupsQuery.isLoading && <TableStateRow colSpan={5} loading />}

                {!taxGroupsQuery.isLoading && taxGroups.length === 0 && (
                  <TableStateRow colSpan={5} message={t('empty')} />
                )}

                {taxGroups.map((taxGroup) => (
                  <TableRow key={taxGroup.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{taxGroup.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {t('badges.rateCount', { count: taxGroup.tax_rate_count })}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                        {taxGroup.tax_rates.map((taxRate) => (
                          <Chip
                            key={taxRate.id}
                            size="small"
                            label={`${taxRate.name} (${formatTaxRate(taxRate.rate, taxRate.type)})`}
                          />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>{taxGroup.description || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={taxGroup.is_active ? t('common:status.active') : t('common:status.inactive')}
                        color={taxGroup.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteTaxGroup.isPending}
                        onEdit={() => openEditForm(taxGroup)}
                        onDelete={() => setDeletingTaxGroup(taxGroup)}
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
