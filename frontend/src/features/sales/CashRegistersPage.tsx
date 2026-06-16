'use client'

import { FormEvent, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  Add,
  CheckCircleOutlined,
} from '@/components/ui/icons'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { useBranchesQuery } from '@/features/branches/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useAuthStore } from '@/stores/authStore'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { formatMoney } from '@/utils/formatMoney'
import { formatAppDateTime } from '@/utils/dateFormat'
import { toNumber } from '@/features/sales/formHelpers'
import { CashRegisterSessionDialog } from '@/features/sales/components/CashRegisterSessionDialog'
import type { BranchFilters } from '@/types/branch'
import type {
  CashRegister,
  CashRegisterFilters,
  CreateCashRegisterPayload,
  OpenCashRegisterSessionPayload,
  UpdateCashRegisterPayload,
} from '@/types/sales'
import {
  useCashRegistersQuery,
  useCreateCashRegisterMutation,
  useUpdateCashRegisterMutation,
  useDeleteCashRegisterMutation,
  useOpenCashRegisterSessionMutation,
} from '@/features/sales/hooks'

const statusOptions: CashRegisterFilters['status'][] = ['active', 'inactive']

function CashRegisterFormDialog({
  open,
  register,
  branches,
  isSaving,
  onClose,
  onSubmit,
}: {
  open: boolean
  register: CashRegister | null
  branches: Array<{ id: string; name: string; code?: string | null }>
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: CreateCashRegisterPayload | UpdateCashRegisterPayload) => Promise<void>
}) {
  const { t } = useTranslation(['sales', 'common'])
  const [branchId, setBranchId] = useState(register?.branch_id ?? '')
  const [name, setName] = useState(register?.name ?? '')
  const [isActive, setIsActive] = useState(register?.is_active ?? true)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    if (!branchId || !name.trim()) {
      setFormError(t('cashRegisters.form.required'))
      return
    }

    try {
      await onSubmit({
        branch_id: branchId,
        name: name.trim(),
        is_active: isActive,
      })
      onClose()
    } catch (error) {
      setFormError(toAppApiError(error).message)
    }
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle>
          {register ? t('cashRegisters.form.editTitle') : t('cashRegisters.form.createTitle')}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              select
              label={t('cashRegisters.fields.branch')}
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              required
              disabled={isSaving}
            >
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {[branch.name, branch.code].filter(Boolean).join(' / ')}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t('cashRegisters.fields.name')}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              disabled={isSaving}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  disabled={isSaving}
                />
              }
              label={t('cashRegisters.fields.active')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose} disabled={isSaving}>
            {t('common:buttons.cancel')}
          </Button>
          <Button variant="contained" type="submit" disabled={isSaving}>
            {t('common:buttons.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

function OpenSessionDialog({
  open,
  register,
  isSaving,
  onClose,
  onSubmit,
}: {
  open: boolean
  register: CashRegister | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: OpenCashRegisterSessionPayload) => Promise<void>
}) {
  const { t } = useTranslation(['sales', 'common'])
  const [openingFloat, setOpeningFloat] = useState(0)
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    try {
      await onSubmit({
        opening_float: openingFloat,
        notes: notes.trim() || null,
      })
      onClose()
    } catch (error) {
      setFormError(toAppApiError(error).message)
    }
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle>{t('cashRegisters.openDialog.title', { name: register?.name ?? '' })}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              type="number"
              label={t('cashRegisters.fields.openingFloat')}
              value={openingFloat}
              onChange={(event) => setOpeningFloat(toNumber(event.target.value))}
              disabled={isSaving}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />
            <TextField
              label={t('cashRegisters.fields.notes')}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              multiline
              minRows={2}
              disabled={isSaving}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose} disabled={isSaving}>
            {t('common:buttons.cancel')}
          </Button>
          <Button variant="contained" type="submit" disabled={isSaving}>
            {t('cashRegisters.actions.openSession')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

function SessionsDialog({
  open,
  register,
  dateFormat,
  language,
  onClose,
}: {
  open: boolean
  register: CashRegister | null
  dateFormat: string | null
  language: string
  onClose: () => void
}) {
  const { t } = useTranslation(['sales', 'common'])
  const formatter = useCurrencyFormatter()
  const sessions = register?.recent_sessions ?? []

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{t('cashRegisters.sessions.title', { name: register?.name ?? '' })}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('cashRegisters.sessions.user')}</TableCell>
                <TableCell>{t('cashRegisters.sessions.opened')}</TableCell>
                <TableCell>{t('cashRegisters.sessions.closed')}</TableCell>
                <TableCell align="right">{t('cashRegisters.sessions.openingFloat')}</TableCell>
                <TableCell align="right">{t('cashRegisters.sessions.closingFloat')}</TableCell>
                <TableCell>{t('cashRegisters.sessions.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.length === 0 && (
                <TableStateRow colSpan={6} message={t('cashRegisters.sessions.empty')} />
              )}
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.user?.name || session.user?.email || '-'}</TableCell>
                  <TableCell>{formatAppDateTime(session.opened_at, dateFormat, language)}</TableCell>
                  <TableCell>{formatAppDateTime(session.closed_at, dateFormat, language)}</TableCell>
                  <TableCell align="right">{formatMoney(session.opening_float, formatter)}</TableCell>
                  <TableCell align="right">{formatMoney(session.closing_float, formatter)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={session.status === 'open' ? 'success' : 'default'}
                      label={t(`cashRegisters.sessionStatuses.${session.status}`, { defaultValue: session.status })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          {t('common:buttons.close')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function CashRegistersPage() {
  const { t, i18n } = useTranslation(['sales', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<CashRegisterFilters['status']>('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRegister, setEditingRegister] = useState<CashRegister | null>(null)
  const [openingRegister, setOpeningRegister] = useState<CashRegister | null>(null)
  const [closingRegister, setClosingRegister] = useState<CashRegister | null>(null)
  const [viewingRegister, setViewingRegister] = useState<CashRegister | null>(null)
  const [deletingRegister, setDeletingRegister] = useState<CashRegister | null>(null)
  const formatter = useCurrencyFormatter()
  const dateFormat = useAppDateFormat()

  const filters: CashRegisterFilters = useMemo(
    () => ({
      search: search || undefined,
      branch_id: branchFilter || undefined,
      status: statusFilter || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [branchFilter, page, perPage, search, statusFilter]
  )

  const branchFilters: BranchFilters = useMemo(
    () => ({
      is_active: true,
      per_page: 100,
    }),
    []
  )

  const registersQuery = useCashRegistersQuery(filters)
  const branchesQuery = useBranchesQuery(branchFilters)
  const createRegister = useCreateCashRegisterMutation()
  const updateRegister = useUpdateCashRegisterMutation()
  const deleteRegister = useDeleteCashRegisterMutation()
  const openSession = useOpenCashRegisterSessionMutation()

  const registers = useMemo(() => registersQuery.data?.data ?? [], [registersQuery.data?.data])
  const branches = useMemo(() => branchesQuery.data?.data ?? [], [branchesQuery.data?.data])
  const meta = registersQuery.data?.meta
  const canManage = can('sales.edit')
  const canUseSession = can('sales.create')

  const columns = useMemo<EntityTableColumn<CashRegister>[]>(
    () => [
      {
        key: 'register',
        label: t('cashRegisters.columns.register'),
        render: (register) => (
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">{register.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('cashRegisters.labels.sessionsCount', { count: register.sessions_count ?? 0 })}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'branch',
        label: t('cashRegisters.columns.branch'),
        render: (register) => register.branch?.name ?? '-',
      },
      {
        key: 'session',
        label: t('cashRegisters.columns.session'),
        render: (register) => {
          const openSessionRecord = register.current_open_session
          return openSessionRecord ? (
            <Stack spacing={0.25}>
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={t('cashRegisters.sessionStatuses.open')}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formatAppDateTime(openSessionRecord.opened_at, dateFormat, i18n.language)}
              </Typography>
            </Stack>
          ) : (
            <Chip
              size="small"
              variant="outlined"
              label={t('cashRegisters.sessionStatuses.closed')}
            />
          )
        },
      },
      {
        key: 'openingFloat',
        label: t('cashRegisters.columns.openingFloat'),
        align: 'right',
        render: (register) => formatMoney(register.current_open_session?.opening_float, formatter),
      },
      {
        key: 'status',
        label: t('cashRegisters.columns.status'),
        render: (register) => (
          <Chip
            size="small"
            variant="outlined"
            color={register.is_active ? 'success' : 'default'}
            label={t(`cashRegisters.statuses.${register.status}`)}
          />
        ),
      },
    ],
    [dateFormat, formatter, i18n.language, t]
  )

  const summary = useMemo(() => ({
    total: meta?.total ?? registers.length,
    active: registers.filter((register) => register.is_active).length,
    open: registers.filter((register) => !!register.current_open_session).length,
    inactive: registers.filter((register) => !register.is_active).length,
  }), [meta?.total, registers])

  const clearFilters = () => {
    setBranchFilter('')
    setStatusFilter('')
    setPage(0)
  }

  const activeFilters = [
    branchFilter
      ? {
          key: 'branch',
          label: `${t('cashRegisters.filters.branch')}: ${
            branches.find((branch) => branch.id === branchFilter)?.name ?? branchFilter
          }`,
          onDelete: () => {
            setBranchFilter('')
            setPage(0)
          },
        }
      : null,
    statusFilter
      ? {
          key: 'status',
          label: `${t('cashRegisters.filters.status')}: ${t(`cashRegisters.statuses.${statusFilter}`)}`,
          onDelete: () => {
            setStatusFilter('')
            setPage(0)
          },
        }
      : null,
  ].filter((filter): filter is { key: string; label: string; onDelete: () => void } => Boolean(filter))

  const handleSubmit = async (payload: CreateCashRegisterPayload | UpdateCashRegisterPayload) => {
    if (editingRegister) {
      await updateRegister.mutateAsync({ id: editingRegister.id, payload })
      enqueueSnackbar(t('cashRegisters.messages.updated'), { variant: 'success' })
      return
    }

    await createRegister.mutateAsync(payload as CreateCashRegisterPayload)
    enqueueSnackbar(t('cashRegisters.messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleOpenSession = async (payload: OpenCashRegisterSessionPayload) => {
    if (!openingRegister) return

    await openSession.mutateAsync({ id: openingRegister.id, payload })
    enqueueSnackbar(t('cashRegisters.messages.opened'), { variant: 'success' })
    setOpeningRegister(null)
  }

  const handleDelete = async () => {
    if (!deletingRegister) return

    try {
      await deleteRegister.mutateAsync(deletingRegister.id)
      enqueueSnackbar(t('cashRegisters.messages.deleted'), { variant: 'success' })
      setDeletingRegister(null)
    } catch (error) {
      enqueueSnackbar(toAppApiError(error).message, { variant: 'error' })
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={t('cashRegisters.title')}
        description={t('cashRegisters.subtitle')}
        actions={canManage && (
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={() => {
              setEditingRegister(null)
              setFormOpen(true)
            }}
          >
            {t('cashRegisters.actions.new')}
          </Button>
        )}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        {(['total', 'active', 'open', 'inactive'] as const).map((key) => (
          <Card key={key}>
            <CardContent>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t(`cashRegisters.summary.${key}`)}
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.75 }}>
                {summary[key]}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('cashRegisters.filters.search')}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(0)
        }}
        filterButtonLabel={t('filters.showAdvanced')}
        clearFiltersLabel={t('filters.clear')}
        activeFilters={activeFilters}
        onClearFilters={activeFilters.length > 0 ? clearFilters : undefined}
        filters={
          <>
            <SearchableFilterSelect
              value={branchFilter}
              options={branches}
              loading={branchesQuery.isLoading}
              label={t('cashRegisters.filters.branch')}
              placeholder={t('cashRegisters.filters.allBranches')}
              getOptionValue={(branch) => branch.id}
              getOptionLabel={(branch) => branch.name}
              getOptionDescription={(branch) => branch.code}
              onChange={(value) => {
                setBranchFilter(value)
                setPage(0)
              }}
              sx={{ minWidth: { xs: '100%', lg: 240 } }}
            />
            <TextField
              select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as CashRegisterFilters['status'])
                setPage(0)
              }}
              label={t('cashRegisters.filters.status')}
              sx={{ minWidth: { xs: '100%', lg: 180 } }}
            >
              <MenuItem value="">{t('cashRegisters.filters.allStatuses')}</MenuItem>
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {t(`cashRegisters.statuses.${status}`)}
                </MenuItem>
              ))}
            </TextField>
          </>
        }
      />

      {registersQuery.isError && (
        <Alert severity="error">
          {toAppApiError(registersQuery.error).message}
        </Alert>
      )}
      {branchesQuery.isError && (
        <Alert severity="warning">
          {toAppApiError(branchesQuery.error).message}
        </Alert>
      )}

      <EntityTable
        rows={registers}
        columns={columns}
        getRowKey={(register) => register.id}
        loading={registersQuery.isLoading}
        emptyTitle={t('cashRegisters.empty')}
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
        rowActions={(register) => {
          const openSessionRecord = register.current_open_session
          return (
            <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
              {canUseSession && register.is_active && !openSessionRecord && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CheckCircleOutlined />}
                  onClick={() => setOpeningRegister(register)}
                >
                  {t('cashRegisters.actions.openSession')}
                </Button>
              )}
              {canUseSession && openSessionRecord && (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={() => setClosingRegister(register)}
                >
                  {t('cashRegisters.actions.closeSession')}
                </Button>
              )}
              <RowActions
                viewLabel={t('cashRegisters.actions.sessions')}
                editLabel={t('common:buttons.edit')}
                deleteLabel={t('common:buttons.delete')}
                showView
                showEdit={canManage}
                showDelete={canManage}
                deleteDisabled={deleteRegister.isPending || !!openSessionRecord}
                onView={() => setViewingRegister(register)}
                onEdit={() => {
                  setEditingRegister(register)
                  setFormOpen(true)
                }}
                onDelete={() => setDeletingRegister(register)}
              />
            </Stack>
          )
        }}
      />

      <CashRegisterFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingRegister?.id ?? 'new'}`}
        open={formOpen}
        register={editingRegister}
        branches={branches}
        isSaving={createRegister.isPending || updateRegister.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <OpenSessionDialog
        key={`open-${openingRegister?.id ?? 'none'}`}
        open={!!openingRegister}
        register={openingRegister}
        isSaving={openSession.isPending}
        onClose={() => setOpeningRegister(null)}
        onSubmit={handleOpenSession}
      />

      <CashRegisterSessionDialog
        key={closingRegister?.current_open_session?.id ?? 'no-session'}
        open={!!closingRegister}
        register={closingRegister}
        onClose={() => setClosingRegister(null)}
        onClosed={() => setClosingRegister(null)}
      />

      <SessionsDialog
        open={!!viewingRegister}
        register={viewingRegister}
        dateFormat={dateFormat}
        language={i18n.language}
        onClose={() => setViewingRegister(null)}
      />

      <ConfirmDialog
        open={!!deletingRegister}
        title={t('cashRegisters.deleteDialog.title')}
        message={t('cashRegisters.deleteDialog.message', { name: deletingRegister?.name ?? '' })}
        confirmText={t('cashRegisters.deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteRegister.isPending}
        onClose={() => setDeletingRegister(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
