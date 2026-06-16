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
import { Add, AccountTreeOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { BranchFormDialog } from '@/features/branches/BranchFormDialog'
import {
  useBranchesQuery,
  useCreateBranchMutation,
  useDeleteBranchMutation,
  useUpdateBranchMutation,
} from '@/features/branches/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { Branch, BranchFilters, BranchPayload } from '@/types/branch'

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

  const activeFilters = useMemo(() => {
    const items: Array<{ key: string; label: string; onDelete: () => void }> = []
    if (activeFilter !== '') {
      items.push({
        key: 'status',
        label: `${t('filters.status')}: ${activeFilter ? t('common:status.active') : t('common:status.inactive')}`,
        onDelete: () => {
          setActiveFilter('')
          setPage(0)
        },
      })
    }
    return items
  }, [activeFilter, t])

  const clearFilters = () => {
    setActiveFilter('')
    setPage(0)
  }

  const columns: EntityTableColumn<Branch>[] = useMemo(
    () => [
      {
        key: 'branch',
        label: t('columns.branch'),
        render: (branch) => (
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">{branch.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {branch.code}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'type',
        label: t('columns.type'),
        render: (branch) => t(`type.${branch.type}`),
      },
      {
        key: 'manager',
        label: t('columns.manager'),
        render: (branch) =>
          branch.manager
            ? `${branch.manager.first_name} ${branch.manager.last_name}`.trim()
            : t('placeholders.noManager'),
      },
      {
        key: 'contact',
        label: t('columns.contact'),
        render: (branch) => (
          <Stack spacing={0.25}>
            <Typography variant="body2">{branch.email || '-'}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {branch.phone || '-'}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'default',
        label: t('columns.default'),
        render: (branch) =>
          branch.is_default ? (
            <Chip size="small" color="primary" label={t('badges.default')} />
          ) : (
            '-'
          ),
      },
      {
        key: 'status',
        label: t('columns.status'),
        render: (branch) => (
          <Chip
            size="small"
            label={branch.is_active ? t('common:status.active') : t('common:status.inactive')}
            color={branch.is_active ? 'success' : 'default'}
          />
        ),
      },
    ],
    [t]
  )

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<AccountTreeOutlined color="primary" />}
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
        filters={
          <>
            <TextField
              select
              value={activeFilter === '' ? '' : String(activeFilter)}
              label={t('filters.status')}
              onChange={(event) => {
                setActiveFilter(event.target.value === '' ? '' : event.target.value === 'true')
                setPage(0)
              }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
              <MenuItem value="true">{t('common:status.active')}</MenuItem>
              <MenuItem value="false">{t('common:status.inactive')}</MenuItem>
            </TextField>
          </>
        }
        activeFilters={activeFilters}
        onClearFilters={activeFilters.length > 0 ? clearFilters : undefined}
      />

      {branchesQuery.isError && (
        <Alert severity="error">{toAppApiError(branchesQuery.error).message}</Alert>
      )}

      <EntityTable
        rows={branches}
        columns={columns}
        getRowKey={(branch) => branch.id}
        loading={branchesQuery.isLoading}
        emptyIcon={<AccountTreeOutlined />}
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
        rowActions={(branch) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deleteBranch.isPending}
            onEdit={() => openEditForm(branch)}
            onDelete={() => setDeletingBranch(branch)}
          />
        )}
      />

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
