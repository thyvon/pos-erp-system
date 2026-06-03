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
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { Add, PeopleAltOutlined, Search } from '@/components/ui/icons'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
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

const rowsPerPageOptions = [10, 25, 50]

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
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <PeopleAltOutlined color="primary" />
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
          </Stack>

          {rolesQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(rolesQuery.error).message}
            </Alert>
          )}

          {optionsQuery.isError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {toAppApiError(optionsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.role')}</TableCell>
                  <TableCell>{t('columns.permissions')}</TableCell>
                  <TableCell>{t('columns.users')}</TableCell>
                  <TableCell>{t('columns.type')}</TableCell>
                  <TableCell align="center">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rolesQuery.isLoading && <TableStateRow colSpan={5} loading />}

                {!rolesQuery.isLoading && roles.length === 0 && (
                  <TableStateRow colSpan={5} message={t('empty')} />
                )}

                {roles.map((role) => (
                  <TableRow key={role.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{role.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {t('summary.updatedAt', {
                            date: role.updated_at ? new Date(role.updated_at).toLocaleDateString() : '-',
                          })}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.75 }}>
                        <Chip size="small" color="primary" variant="outlined" label={role.permissions_count} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {t('summary.permissionsCount', { count: role.permissions_count })}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {t('summary.usersCount', { count: role.users_count })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={role.is_protected ? 'warning' : 'default'}
                        label={role.is_protected ? t('type.protected') : t('type.custom')}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete && !role.is_protected}
                        deleteDisabled={deleteRole.isPending || role.users_count > 0}
                        onEdit={() => openEditForm(role)}
                        onDelete={() => setDeletingRole(role)}
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
