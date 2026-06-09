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
import { Add, PeopleAltOutlined, Search, UploadOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { UserFormDialog } from '@/features/users/UserFormDialog'
import { UserImportDialog } from '@/features/users/components/UserImportDialog'
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useUserAccessOptionsQuery,
  useUsersQuery,
} from '@/features/users/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { ImportResult, UserFilters, UserListItem, UserPayload, UserStatus } from '@/types/user'

const rowsPerPageOptions = [10, 25, 50]
const userStatuses: UserStatus[] = ['active', 'inactive', 'suspended']

function displayNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '0'
  return String(value)
}

export default function UsersPage() {
  const { t } = useTranslation(['users', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserFilters['status']>('')
  const [roleFilter, setRoleFilter] = useState<UserFilters['role']>('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null)

  const filters: UserFilters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter,
      role: roleFilter,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, roleFilter, search, statusFilter]
  )

  const usersQuery = useUsersQuery(filters)
  const optionsQuery = useUserAccessOptionsQuery()
  const createUser = useCreateUserMutation()
  const updateUser = useUpdateUserMutation()
  const deleteUser = useDeleteUserMutation()

  const users = usersQuery.data?.data ?? []
  const meta = usersQuery.data?.meta
  const options = optionsQuery.data
  const canCreate = can('users.create')
  const canEdit = can('users.edit')
  const canDelete = can('users.delete')

  const openCreateForm = () => {
    setEditingUser(null)
    setFormOpen(true)
  }

  const openEditForm = (user: UserListItem) => {
    setEditingUser(user)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: UserPayload) => {
    if (editingUser) {
      await updateUser.mutateAsync({ id: editingUser.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createUser.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
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
          <Stack direction="row" spacing={1.5}>
            <Button startIcon={<UploadOutlined />} variant="outlined" onClick={() => setImportOpen(true)}>
              {t('common:buttons.import')}
            </Button>
            <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
              {t('actions.new')}
            </Button>
          </Stack>
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
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as UserFilters['status'])
                setPage(0)
              }}
              label={t('filters.status')}
              sx={{ minWidth: { xs: '100%', md: 190 } }}
            >
              <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
              {userStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {t(`status.${status}`)}
                </MenuItem>
              ))}
            </TextField>
            <SearchableFilterSelect
              value={roleFilter ?? ''}
              options={options?.roles ?? []}
              loading={optionsQuery.isLoading}
              label={t('filters.role')}
              placeholder={t('filters.allRoles')}
              getOptionValue={(role) => role.name}
              getOptionLabel={(role) => role.name}
              onChange={(value) => {
                setRoleFilter(value)
                setPage(0)
              }}
              sx={{ minWidth: { xs: '100%', md: 190 } }}
            />
          </Stack>

          {usersQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(usersQuery.error).message}
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
                  <TableCell>{t('columns.user')}</TableCell>
                  <TableCell>{t('columns.role')}</TableCell>
                  <TableCell>{t('columns.branches')}</TableCell>
                  <TableCell>{t('columns.salesLimits')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell align="center">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersQuery.isLoading && <TableStateRow colSpan={6} loading />}

                {!usersQuery.isLoading && users.length === 0 && (
                  <TableStateRow colSpan={6} message={t('empty')} />
                )}

                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{user.full_name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {user.email}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {user.roles.length > 0 ? (
                        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                          {user.roles.map((role) => (
                            <Chip key={role} size="small" label={role} />
                          ))}
                        </Stack>
                      ) : (
                        t('placeholders.noRole')
                      )}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {t('summary.salesLimits', {
                          discount: displayNumber(user.max_discount),
                          commission: displayNumber(user.commission_percentage),
                        })}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {displayNumber(user.sales_target_amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`status.${user.status}`)}
                        color={user.status === 'active' ? 'success' : user.status === 'suspended' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteUser.isPending}
                        onEdit={() => openEditForm(user)}
                        onDelete={() => setDeletingUser(user)}
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

      <UserFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingUser?.id ?? 'new'}`}
        open={formOpen}
        user={editingUser}
        options={options}
        isSaving={createUser.isPending || updateUser.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
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
