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
import { Add, AccountTreeOutlined, Search } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { BranchFormDialog } from '@/features/branches/BranchFormDialog'
import {
  useBranchesQuery,
  useCreateBranchMutation,
  useDeleteBranchMutation,
  useUpdateBranchMutation,
} from '@/features/branches/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { Branch, BranchFilters, BranchPayload } from '@/types/branch'

const rowsPerPageOptions = [10, 25, 50]

export default function BranchesPage() {
  const { t } = useTranslation(['branches', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<BranchFilters['is_active']>('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null)

  const filters: BranchFilters = useMemo(
    () => ({
      search: search || undefined,
      is_active: activeFilter,
      page: page + 1,
      per_page: perPage,
    }),
    [activeFilter, page, perPage, search]
  )

  const branchesQuery = useBranchesQuery(filters)
  const createBranch = useCreateBranchMutation()
  const updateBranch = useUpdateBranchMutation()
  const deleteBranch = useDeleteBranchMutation()

  const branches = branchesQuery.data?.data ?? []
  const meta = branchesQuery.data?.meta
  const canCreate = can('branches.create')
  const canEdit = can('branches.edit')
  const canDelete = can('branches.delete')

  const openCreateForm = () => {
    setEditingBranch(null)
    setFormOpen(true)
  }

  const openEditForm = (branch: Branch) => {
    setEditingBranch(branch)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: BranchPayload) => {
    if (editingBranch) {
      await updateBranch.mutateAsync({ id: editingBranch.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createBranch.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingBranch) return

    try {
      await deleteBranch.mutateAsync(deletingBranch.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingBranch(null)
    } catch (error) {
      const apiError = toAppApiError(error)
      enqueueSnackbar(apiError.message, { variant: 'error' })
    }
  }

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch)
    setPage(0)
  }

  const handleActiveFilterChange = (nextValue: string) => {
    setActiveFilter(nextValue === '' ? '' : nextValue === 'true')
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
            <AccountTreeOutlined color="primary" />
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
              value={activeFilter === '' ? '' : String(activeFilter)}
              onChange={(event) => handleActiveFilterChange(event.target.value)}
              label={t('filters.status')}
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            >
              <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
              <MenuItem value="true">{t('common:status.active')}</MenuItem>
              <MenuItem value="false">{t('common:status.inactive')}</MenuItem>
            </TextField>
          </Stack>

          {branchesQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(branchesQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.branch')}</TableCell>
                  <TableCell>{t('columns.type')}</TableCell>
                  <TableCell>{t('columns.manager')}</TableCell>
                  <TableCell>{t('columns.contact')}</TableCell>
                  <TableCell>{t('columns.default')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell align="right">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branchesQuery.isLoading && <TableStateRow colSpan={7} loading />}

                {!branchesQuery.isLoading && branches.length === 0 && (
                  <TableStateRow colSpan={7} message={t('empty')} />
                )}

                {branches.map((branch) => (
                  <TableRow key={branch.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{branch.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {branch.code}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{t(`type.${branch.type}`)}</TableCell>
                    <TableCell>
                      {branch.manager
                        ? `${branch.manager.first_name} ${branch.manager.last_name}`.trim()
                        : t('placeholders.noManager')}
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{branch.email || '-'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {branch.phone || '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {branch.is_default ? (
                        <Chip size="small" color="primary" label={t('badges.default')} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={branch.is_active ? t('common:status.active') : t('common:status.inactive')}
                        color={branch.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteBranch.isPending}
                        onEdit={() => openEditForm(branch)}
                        onDelete={() => setDeletingBranch(branch)}
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

      <BranchFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingBranch?.id ?? 'new'}`}
        open={formOpen}
        branch={editingBranch}
        isSaving={createBranch.isPending || updateBranch.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingBranch}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingBranch?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteBranch.isPending}
        onClose={() => setDeletingBranch(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
