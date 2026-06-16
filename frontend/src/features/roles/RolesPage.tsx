'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { Add, PeopleAltOutlined } from '@/components/ui/icons'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { useAuthStore } from '@/stores/authStore'
import { RoleFormDialog } from './RoleFormDialog'
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useRoleOptionsQuery,
  useRolesQuery,
  useUpdateRoleMutation,
} from './hooks'
import type { RoleFilters, RoleListItem, RolePayload } from '@/types/role'

export function RolesPage() {
  const { t } = useTranslation(['roles', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleListItem | null>(null)
  const [deletingRole, setDeletingRole] = useState<RoleListItem | null>(null)

  const filters: RoleFilters = useMemo(
    () => ({
      search: search || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search]
  )

  const rolesQuery = useRolesQuery(filters)
  const optionsQuery = useRoleOptionsQuery()
  const createRole = useCreateRoleMutation()
  const updateRole = useUpdateRoleMutation()
  const deleteRole = useDeleteRoleMutation()
  const roles = rolesQuery.data?.data ?? []
  const meta = rolesQuery.data?.meta
  const canCreate = can('roles.create')
  const canEdit = can('roles.edit')
  const canDelete = can('roles.delete')

  const columns = useMemo<EntityTableColumn<RoleListItem>[]>(
    () => [
      {
        key: 'role',
        label: t('columns.role'),
        render: (role) => (
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">{role.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('summary.updatedAt', {
                date: role.updated_at ? new Date(role.updated_at).toLocaleDateString() : '-',
              })}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'permissions',
        label: t('columns.permissions'),
        render: (role) => (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.75 }}>
            <Chip size="small" color="primary" variant="outlined" label={role.permissions_count} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('summary.permissionsCount', { count: role.permissions_count })}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'users',
        label: t('columns.users'),
        render: (role) => (
          <Typography variant="body2">
            {t('summary.usersCount', { count: role.users_count })}
          </Typography>
        ),
      },
      {
        key: 'type',
        label: t('columns.type'),
        render: (role) => (
          <Chip
            size="small"
            color={role.is_protected ? 'warning' : 'default'}
            label={role.is_protected ? t('type.protected') : t('type.custom')}
          />
        ),
      },
    ],
    [t]
  )

  const openCreateForm = () => {
    setEditingRole(null)
    setFormOpen(true)
  }

  const openEditForm = (role: RoleListItem) => {
    setEditingRole(role)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: RolePayload) => {
    if (editingRole) {
      await updateRole.mutateAsync({ id: editingRole.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createRole.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingRole) return

    try {
      await deleteRole.mutateAsync(deletingRole.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingRole(null)
    } catch (error) {
      enqueueSnackbar(toAppApiError(error).message, { variant: 'error' })
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<PeopleAltOutlined color="primary" />}
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
      />

      {rolesQuery.isError && (
        <Alert severity="error">
          {toAppApiError(rolesQuery.error).message}
        </Alert>
      )}

      {optionsQuery.isError && (
        <Alert severity="warning">
          {toAppApiError(optionsQuery.error).message}
        </Alert>
      )}

      <EntityTable
        rows={roles}
        columns={columns}
        getRowKey={(role) => role.id}
        loading={rolesQuery.isLoading}
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
        rowActions={(role) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete && !role.is_protected}
            deleteDisabled={deleteRole.isPending || role.users_count > 0}
            onEdit={() => openEditForm(role)}
            onDelete={() => setDeletingRole(role)}
          />
        )}
      />

      <RoleFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingRole?.id ?? 'new'}`}
        open={formOpen}
        role={editingRole}
        options={optionsQuery.data}
        isSaving={createRole.isPending || updateRole.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingRole}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingRole?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteRole.isPending}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
