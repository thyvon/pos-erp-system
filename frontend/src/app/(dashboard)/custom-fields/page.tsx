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
import { Add, TuneOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { CustomFieldFormDialog } from '@/features/custom-fields/CustomFieldFormDialog'
import {
  useCreateCustomFieldMutation,
  useCustomFieldsQuery,
  useDeleteCustomFieldMutation,
  useUpdateCustomFieldMutation,
} from '@/features/custom-fields/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { CustomFieldDefinition, CustomFieldFilters, CustomFieldModule, CustomFieldPayload } from '@/types/customField'

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

  const activeFilters = useMemo(() => {
    const items: Array<{ key: string; label: string; onDelete: () => void }> = []

    if (moduleFilter) {
      items.push({
        key: 'module',
        label: `${t('filters.module')}: ${t(`module.${moduleFilter}`)}`,
        onDelete: () => {
          setModuleFilter('')
          setPage(0)
        },
      })
    }

    return items
  }, [moduleFilter, t])

  const clearFilters = () => {
    setModuleFilter('')
    setPage(0)
  }

  const columns: EntityTableColumn<CustomFieldDefinition>[] = useMemo(
    () => [
      {
        key: 'field',
        label: t('columns.field'),
        render: (customField) => (
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">{customField.field_label}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {customField.field_name}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'module',
        label: t('columns.module'),
        render: (customField) => t(`module.${customField.module}`),
      },
      {
        key: 'type',
        label: t('columns.type'),
        render: (customField) => t(`fieldType.${customField.field_type}`),
      },
      {
        key: 'options',
        label: t('columns.options'),
        render: (customField) =>
          customField.options?.length ? (
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
          ),
      },
      {
        key: 'required',
        label: t('columns.required'),
        render: (customField) => (
          <Chip
            size="small"
            label={customField.is_required ? t('badges.yes') : t('badges.no')}
            color={customField.is_required ? 'primary' : 'default'}
          />
        ),
      },
      {
        key: 'sortOrder',
        label: t('columns.sortOrder'),
        render: (customField) => customField.sort_order,
      },
    ],
    [t]
  )

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<TuneOutlined color="primary" />}
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
        onSearchChange={handleSearchChange}
        filters={
          <TextField
            select
            value={moduleFilter}
            onChange={(event) => handleModuleFilterChange(event.target.value)}
            label={t('filters.module')}
          >
            <MenuItem value="">{t('filters.allModules')}</MenuItem>
            {modules.map((module) => (
              <MenuItem key={module} value={module}>
                {t(`module.${module}`)}
              </MenuItem>
            ))}
          </TextField>
        }
        activeFilters={activeFilters}
        onClearFilters={activeFilters.length > 0 ? clearFilters : undefined}
      />

      {customFieldsQuery.isError && (
        <Alert severity="error">{toAppApiError(customFieldsQuery.error).message}</Alert>
      )}

      <EntityTable
        rows={customFields}
        columns={columns}
        getRowKey={(customField) => customField.id}
        loading={customFieldsQuery.isLoading}
        emptyIcon={<TuneOutlined />}
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
        rowActions={(customField) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deleteCustomField.isPending}
            onEdit={() => openEditForm(customField)}
            onDelete={() => setDeletingCustomField(customField)}
          />
        )}
      />

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
