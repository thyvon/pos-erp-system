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
import { Add, CategoryOutlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
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

const rowsPerPageOptions = [10, 25, 50]

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
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CategoryOutlined color="primary" />
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
              value={parentId}
              onChange={(event) => {
                setParentId(event.target.value)
                setPage(0)
              }}
              label={t('filters.parent')}
              sx={{ minWidth: { xs: '100%', md: 240 } }}
              disabled={parentOptionsQuery.isLoading}
            >
              <MenuItem value="">{t('filters.allParents')}</MenuItem>
              {parentOptions.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {categoriesQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(categoriesQuery.error).message}
            </Alert>
          )}

          {parentOptionsQuery.isError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {toAppApiError(parentOptionsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.category')}</TableCell>
                  <TableCell>{t('columns.parent')}</TableCell>
                  <TableCell>{t('columns.shortCode')}</TableCell>
                  <TableCell>{t('columns.sortOrder')}</TableCell>
                  <TableCell>{t('columns.children')}</TableCell>
                  <TableCell align="right">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categoriesQuery.isLoading && <TableStateRow colSpan={6} loading />}

                {!categoriesQuery.isLoading && categories.length === 0 && (
                  <TableStateRow colSpan={6} message={t('empty')} />
                )}

                {categories.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{category.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {category.code || '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {category.parent ? (
                        <Chip size="small" label={category.parent.name} variant="outlined" />
                      ) : (
                        <Chip size="small" label={t('labels.root')} color="primary" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>{category.short_code || '-'}</TableCell>
                    <TableCell>{category.sort_order}</TableCell>
                    <TableCell>{category.children_count}</TableCell>
                    <TableCell align="right">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteCategory.isPending}
                        onEdit={() => openEditForm(category)}
                        onDelete={() => setDeletingCategory(category)}
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
