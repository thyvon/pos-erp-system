'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import { Add, CategoryOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { CategoryFormDialog } from '@/features/categories/CategoryFormDialog'
import {
  useCategoriesQuery,
  useCategoryOptionsQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from '@/features/categories/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { Category, CategoryFilters, CategoryPayload } from '@/types/category'

export default function CategoriesPage() {
  const { t } = useTranslation(['categories', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [parentId, setParentId] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const filters: CategoryFilters = useMemo(
    () => ({
      search: search || undefined,
      parent_id: parentId || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, parentId, perPage, search]
  )

  const categoriesQuery = useCategoriesQuery(filters)
  const parentOptionsQuery = useCategoryOptionsQuery()
  const createCategory = useCreateCategoryMutation()
  const updateCategory = useUpdateCategoryMutation()
  const deleteCategory = useDeleteCategoryMutation()

  const categories = categoriesQuery.data?.data ?? []
  const parentOptions = parentOptionsQuery.data ?? []
  const meta = categoriesQuery.data?.meta
  const canCreate = can('categories.create')
  const canEdit = can('categories.edit')
  const canDelete = can('categories.delete')

  const columns: EntityTableColumn<Category>[] = useMemo(
    () => [
      {
        key: 'category',
        label: t('columns.category'),
        render: (category) => (
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">{category.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {category.code || '-'}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'parent',
        label: t('columns.parent'),
        render: (category) => (
          category.parent ? (
            <Chip size="small" label={category.parent.name} variant="outlined" />
          ) : (
            <Chip size="small" label={t('labels.root')} color="primary" variant="outlined" />
          )
        ),
      },
      { key: 'shortCode', label: t('columns.shortCode'), render: (category) => category.short_code || '-' },
      { key: 'sortOrder', label: t('columns.sortOrder'), render: (category) => category.sort_order },
      { key: 'children', label: t('columns.children'), render: (category) => category.children_count },
    ],
    [t]
  )

  const openCreateForm = () => {
    setEditingCategory(null)
    setFormOpen(true)
  }

  const openEditForm = (category: Category) => {
    setEditingCategory(category)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: CategoryPayload) => {
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createCategory.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingCategory) return

    try {
      await deleteCategory.mutateAsync(deletingCategory.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingCategory(null)
    } catch (error) {
      const apiError = toAppApiError(error)
      enqueueSnackbar(apiError.message, { variant: 'error' })
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<CategoryOutlined color="primary" />}
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
        onSearchChange={(value) => { setSearch(value); setPage(0) }}
        filters={
          <SearchableFilterSelect
            value={parentId}
            options={parentOptions}
            loading={parentOptionsQuery.isLoading}
            label={t('filters.parent')}
            placeholder={t('filters.allParents')}
            getOptionValue={(category) => category.id}
            getOptionLabel={(category) => category.name}
            getOptionDescription={(category) => category.short_code}
            onChange={(value) => { setParentId(value); setPage(0) }}
            sx={{ minWidth: { xs: '100%', sm: 240 } }}
          />
        }
      />

      {categoriesQuery.isError && (
        <Alert severity="error">{toAppApiError(categoriesQuery.error).message}</Alert>
      )}

      {parentOptionsQuery.isError && (
        <Alert severity="warning">{toAppApiError(parentOptionsQuery.error).message}</Alert>
      )}

      <EntityTable
        rows={categories}
        columns={columns}
        getRowKey={(category) => category.id}
        loading={categoriesQuery.isLoading}
        emptyIcon={<CategoryOutlined />}
        emptyTitle={t('empty')}
        emptyDescription="Try changing your filters or create a new category."
        pagination={{
          page,
          rowsPerPage: perPage,
          count: meta?.total ?? 0,
          onPageChange: setPage,
          onRowsPerPageChange: (nextPerPage) => { setPerPage(nextPerPage); setPage(0) },
        }}
        rowActions={(category) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deleteCategory.isPending}
            onEdit={() => openEditForm(category)}
            onDelete={() => setDeletingCategory(category)}
          />
        )}
      />

      <CategoryFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingCategory?.id ?? 'new'}`}
        open={formOpen}
        category={editingCategory}
        parentOptions={parentOptions}
        isLoadingParentOptions={parentOptionsQuery.isLoading}
        isSaving={createCategory.isPending || updateCategory.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingCategory}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingCategory?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteCategory.isPending}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
