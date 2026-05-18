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
import { Add, Search, TuneOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { CustomFieldFormDialog } from '@/features/custom-fields/CustomFieldFormDialog'
import {
  useCreateCustomFieldMutation,
  useCustomFieldsQuery,
  useDeleteCustomFieldMutation,
  useUpdateCustomFieldMutation,
} from '@/features/custom-fields/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { CustomFieldDefinition, CustomFieldFilters, CustomFieldModule, CustomFieldPayload } from '@/types/customField'

const rowsPerPageOptions = [10, 25, 50]
const modules: CustomFieldModule[] = ['product', 'customer', 'supplier']

export default function CustomFieldsPage() {
  const { t } = useTranslation(['customFields', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState<CustomFieldFilters['module']>('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomField, setEditingCustomField] = useState<CustomFieldDefinition | null>(null)
  const [deletingCustomField, setDeletingCustomField] = useState<CustomFieldDefinition | null>(null)

  const filters: CustomFieldFilters = useMemo(
    () => ({
      search: search || undefined,
      module: moduleFilter,
      page: page + 1,
      per_page: perPage,
    }),
    [moduleFilter, page, perPage, search]
  )

  const customFieldsQuery = useCustomFieldsQuery(filters)
  const createCustomField = useCreateCustomFieldMutation()
  const updateCustomField = useUpdateCustomFieldMutation()
  const deleteCustomField = useDeleteCustomFieldMutation()

  const customFields = customFieldsQuery.data?.data ?? []
  const meta = customFieldsQuery.data?.meta
  const canCreate = can('custom_fields.create')
  const canEdit = can('custom_fields.edit')
  const canDelete = can('custom_fields.delete')

  const openCreateForm = () => {
    setEditingCustomField(null)
    setFormOpen(true)
  }

  const openEditForm = (customField: CustomFieldDefinition) => {
    setEditingCustomField(customField)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: CustomFieldPayload) => {
    if (editingCustomField) {
      await updateCustomField.mutateAsync({ id: editingCustomField.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createCustomField.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingCustomField) return

    try {
      await deleteCustomField.mutateAsync(deletingCustomField.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingCustomField(null)
    } catch (error) {
      const apiError = toAppApiError(error)
      enqueueSnackbar(apiError.message, { variant: 'error' })
    }
  }

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch)
    setPage(0)
  }

  const handleModuleFilterChange = (nextValue: string) => {
    setModuleFilter(nextValue as CustomFieldFilters['module'])
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
            <TuneOutlined color="primary" />
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
              value={moduleFilter}
              onChange={(event) => handleModuleFilterChange(event.target.value)}
              label={t('filters.module')}
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            >
              <MenuItem value="">{t('filters.allModules')}</MenuItem>
              {modules.map((module) => (
                <MenuItem key={module} value={module}>
                  {t(`module.${module}`)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {customFieldsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(customFieldsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.field')}</TableCell>
                  <TableCell>{t('columns.module')}</TableCell>
                  <TableCell>{t('columns.type')}</TableCell>
                  <TableCell>{t('columns.options')}</TableCell>
                  <TableCell>{t('columns.required')}</TableCell>
                  <TableCell>{t('columns.sortOrder')}</TableCell>
                  <TableCell align="right">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customFieldsQuery.isLoading && <TableStateRow colSpan={7} loading />}

                {!customFieldsQuery.isLoading && customFields.length === 0 && (
                  <TableStateRow colSpan={7} message={t('empty')} />
                )}

                {customFields.map((customField) => (
                  <TableRow key={customField.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{customField.field_label}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {customField.field_name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{t(`module.${customField.module}`)}</TableCell>
                    <TableCell>{t(`fieldType.${customField.field_type}`)}</TableCell>
                    <TableCell>
                      {customField.options?.length ? (
                        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                          {customField.options.slice(0, 3).map((option) => (
                            <Chip key={option} size="small" label={option} />
                          ))}
                          {customField.options.length > 3 && (
                            <Chip size="small" label={t('badges.moreOptions', { count: customField.options.length - 3 })} />
                          )}
                        </Stack>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={customField.is_required ? t('badges.yes') : t('badges.no')}
                        color={customField.is_required ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{customField.sort_order}</TableCell>
                    <TableCell align="right">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteCustomField.isPending}
                        onEdit={() => openEditForm(customField)}
                        onDelete={() => setDeletingCustomField(customField)}
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

      <CustomFieldFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingCustomField?.id ?? 'new'}`}
        open={formOpen}
        customField={editingCustomField}
        isSaving={createCustomField.isPending || updateCustomField.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingCustomField}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingCustomField?.field_label ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteCustomField.isPending}
        onClose={() => setDeletingCustomField(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
