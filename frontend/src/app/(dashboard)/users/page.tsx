'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Avatar,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import { Add, ImageOutlined, PeopleAltOutlined, UploadOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { resolveAssetUrl } from '@/api/assets'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { UserImportDialog } from '@/features/users/components/UserImportDialog'
import {
  useDeleteUserMutation,
  useUsersQuery,
} from '@/features/users/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { ImportResult, UserFilters, UserListItem } from '@/types/user'

function displayNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '0'
  return String(value)
}

export default function UsersPage() {
  const { t } = useTranslation(['users', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [importOpen, setImportOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null)

  const filters: UserFilters = useMemo(
    () => ({
      search: search || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search]
  )

  const usersQuery = useUsersQuery(filters)
  const deleteUser = useDeleteUserMutation()

  const users = usersQuery.data?.data ?? []
  const meta = usersQuery.data?.meta
  const canCreate = can('users.create')
  const canEdit = can('users.edit')
  const canDelete = can('users.delete')

  const openCreateForm = () => {
    router.push('/users/create')
  }

  const openEditForm = (user: UserListItem) => {
    router.push(`/users/${user.id}/edit`)
  }

  const handleDelete = async () => {
    if (!deletingUser) return

    try {
      await deleteUser.mutateAsync(deletingUser.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingUser(null)
    } catch (error) {
      const apiError = toAppApiError(error)
      enqueueSnackbar(apiError.message, { variant: 'error' })
    }
  }

  const handleImportSuccess = (result: ImportResult) => {
    if (result.errors && result.errors.length > 0) {
      enqueueSnackbar(
        t('import.result', { imported: result.imported, skipped: result.skipped }),
        { variant: result.skipped > 0 ? 'warning' : 'success' }
      )
    } else {
      enqueueSnackbar(t('import.result', { imported: result.imported, skipped: 0 }), { variant: 'success' })
    }
  }

  const columns: EntityTableColumn<UserListItem>[] = useMemo(
    () => [
      {
        key: 'user',
        label: t('columns.user'),
        render: (user) => (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Avatar
              variant="rounded"
              src={resolveAssetUrl(user.avatar_url)}
              sx={{
                width: 'var(--app-control-height)',
                height: 'var(--app-control-height)',
                borderRadius: 1,
                bgcolor: 'action.hover',
              }}
            >
              <ImageOutlined fontSize="small" />
            </Avatar>
            <Stack sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2">{user.full_name}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {user.email}
              </Typography>
            </Stack>
          </Stack>
        ),
      },
      {
        key: 'role',
        label: t('columns.role'),
        render: (user) =>
          user.roles.length > 0 ? (
            <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
              {user.roles.map((role) => (
                <Chip key={role} size="small" label={role} />
              ))}
            </Stack>
          ) : (
            t('placeholders.noRole')
          ),
      },
      {
        key: 'branches',
        label: t('columns.branches'),
        render: (user) => (
          <Stack spacing={0.25}>
            <Typography variant="body2">
              {user.branches.length > 0
                ? user.branches.map((branch) => branch.name).join(', ')
                : t('placeholders.noBranches')}
            </Typography>
            {user.default_branch && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {user.default_branch.name}
              </Typography>
            )}
          </Stack>
        ),
      },
      {
        key: 'warehouses',
        label: t('columns.warehouses'),
        render: (user) => (
          <Stack spacing={0.25}>
            <Typography variant="body2">
              {user.warehouses && user.warehouses.length > 0
                ? user.warehouses.map((wh) => wh.name).join(', ')
                : t('placeholders.noWarehouses')}
            </Typography>
            {user.default_warehouse && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {user.default_warehouse.name}
              </Typography>
            )}
          </Stack>
        ),
      },
      {
        key: 'salesLimits',
        label: t('columns.salesLimits'),
        render: (user) => (
          <>
            <Typography variant="body2">
              {t('summary.salesLimits', {
                discount: displayNumber(user.max_discount),
                commission: displayNumber(user.commission_percentage),
              })}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {displayNumber(user.sales_target_amount)}
            </Typography>
          </>
        ),
      },
      {
        key: 'status',
        label: t('columns.status'),
        render: (user) => (
          <Chip
            size="small"
            label={t(`status.${user.status}`)}
            color={user.status === 'active' ? 'success' : user.status === 'suspended' ? 'warning' : 'default'}
          />
        ),
      },
    ],
    [t]
  )

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<PeopleAltOutlined color="primary" />}
        title={t('title')}
        description={t('subtitle')}
        actions={canCreate && (
          <Stack direction="row" spacing={1.5}>
            <Button startIcon={<UploadOutlined />} variant="outlined" onClick={() => setImportOpen(true)}>
              {t('common:buttons.import')}
            </Button>
            <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
              {t('actions.new')}
            </Button>
          </Stack>
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

      {usersQuery.isError && (
        <Alert severity="error">{toAppApiError(usersQuery.error).message}</Alert>
      )}

      <EntityTable
        rows={users}
        columns={columns}
        getRowKey={(user) => user.id}
        loading={usersQuery.isLoading}
        emptyIcon={<PeopleAltOutlined />}
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
        rowActions={(user) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deleteUser.isPending}
            onEdit={() => openEditForm(user)}
            onDelete={() => setDeletingUser(user)}
          />
        )}
      />

      <UserImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={handleImportSuccess}
      />

      <ConfirmDialog
        open={!!deletingUser}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingUser?.full_name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteUser.isPending}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
