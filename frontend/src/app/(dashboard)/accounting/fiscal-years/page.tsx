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
import { FiscalYearFormDialog } from '@/features/accounting/FiscalYearFormDialog'
import {
  useCreateFiscalYearMutation,
  useDeleteFiscalYearMutation,
  useFiscalYearsQuery,
  useUpdateFiscalYearMutation,
} from '@/features/accounting/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate, formatAppDateTime } from '@/utils/dateFormat'
import type { FiscalYear, FiscalYearFilters, FiscalYearPayload, FiscalYearStatus } from '@/types/accounting'

const rowsPerPageOptions = [10, 25, 50]
const statuses: FiscalYearStatus[] = ['active', 'closed']

export default function FiscalYearsPage() {
  const { t, i18n } = useTranslation(['accounting', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FiscalYearStatus | ''>('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingFiscalYear, setEditingFiscalYear] = useState<FiscalYear | null>(null)
  const [deletingFiscalYear, setDeletingFiscalYear] = useState<FiscalYear | null>(null)
  const dateFormat = useAppDateFormat()

  const filters: FiscalYearFilters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search, statusFilter]
  )

  const fiscalYearsQuery = useFiscalYearsQuery(filters)
  const createFiscalYear = useCreateFiscalYearMutation()
  const updateFiscalYear = useUpdateFiscalYearMutation()
  const deleteFiscalYear = useDeleteFiscalYearMutation()

  const fiscalYears = fiscalYearsQuery.data?.data ?? []
  const summary = fiscalYearsQuery.data?.summary
  const meta = fiscalYearsQuery.data?.meta
  const canManage = can('accounting.index')

  const openCreateForm = () => {
    setEditingFiscalYear(null)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: FiscalYearPayload) => {
    if (editingFiscalYear) {
      await updateFiscalYear.mutateAsync({ id: editingFiscalYear.id, payload })
      enqueueSnackbar(t('fiscalYears.messages.updated'), { variant: 'success' })
      return
    }

    await createFiscalYear.mutateAsync(payload)
    enqueueSnackbar(t('fiscalYears.messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingFiscalYear) return

    try {
      await deleteFiscalYear.mutateAsync(deletingFiscalYear.id)
      enqueueSnackbar(t('fiscalYears.messages.deleted'), { variant: 'success' })
      setDeletingFiscalYear(null)
    } catch (error) {
      enqueueSnackbar(toAppApiError(error).message, { variant: 'error' })
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
            <Typography variant="h4">{t('fiscalYears.title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('fiscalYears.subtitle')}
          </Typography>
        </Box>
        {canManage && (
          <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
            {t('fiscalYears.actions.new')}
          </Button>
        )}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        {[
          ['total', summary?.total_years ?? 0],
          ['active', summary?.active_years ?? 0],
          ['closed', summary?.closed_years ?? 0],
        ].map(([key, value]) => (
          <Card key={key}>
            <CardContent>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t(`fiscalYears.summary.${key}`)}
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.75 }}>
                {value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', lg: 'center' }, mb: 2.5 }}
          >
            <TextField
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
              placeholder={t('fiscalYears.filters.search')}
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
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as FiscalYearStatus | '')
                setPage(0)
              }}
              label={t('fiscalYears.filters.status')}
              sx={{ minWidth: { xs: '100%', lg: 180 } }}
            >
              <MenuItem value="">{t('fiscalYears.filters.allStatuses')}</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>{t(`fiscalYears.statuses.${status}`)}</MenuItem>
              ))}
            </TextField>
          </Stack>

          {fiscalYearsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(fiscalYearsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('fiscalYears.columns.name')}</TableCell>
                  <TableCell>{t('fiscalYears.columns.period')}</TableCell>
                  <TableCell>{t('fiscalYears.columns.status')}</TableCell>
                  <TableCell align="right">{t('fiscalYears.columns.journals')}</TableCell>
                  <TableCell>{t('fiscalYears.columns.closedAt')}</TableCell>
                  <TableCell align="center">{t('fiscalYears.columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fiscalYearsQuery.isLoading && <TableStateRow colSpan={6} loading />}
                {!fiscalYearsQuery.isLoading && fiscalYears.length === 0 && (
                  <TableStateRow colSpan={6} message={t('fiscalYears.empty')} />
                )}
                {fiscalYears.map((year) => (
                  <TableRow key={year.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{year.name}</Typography>
                    </TableCell>
                    <TableCell>
                      {formatAppDate(year.start_date, dateFormat, i18n.language)} - {formatAppDate(year.end_date, dateFormat, i18n.language)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`fiscalYears.statuses.${year.status}`)}
                        color={year.status === 'active' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{year.journal_count ?? 0}</TableCell>
                    <TableCell>{formatAppDateTime(year.closed_at, dateFormat, i18n.language)}</TableCell>
                    <TableCell align="center">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canManage}
                        showDelete={canManage}
                        deleteDisabled={deleteFiscalYear.isPending}
                        onEdit={() => {
                          setEditingFiscalYear(year)
                          setFormOpen(true)
                        }}
                        onDelete={() => setDeletingFiscalYear(year)}
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

      <FiscalYearFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingFiscalYear?.id ?? 'new'}`}
        open={formOpen}
        fiscalYear={editingFiscalYear}
        isSaving={createFiscalYear.isPending || updateFiscalYear.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingFiscalYear}
        title={t('fiscalYears.deleteDialog.title')}
        message={t('fiscalYears.deleteDialog.message', { name: deletingFiscalYear?.name ?? '' })}
        confirmText={t('fiscalYears.deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteFiscalYear.isPending}
        onClose={() => setDeletingFiscalYear(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
