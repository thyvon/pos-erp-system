'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Button,
  Stack,
  Typography,
} from '@mui/material'
import { Add, ImageOutlined, LocalOfferOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { resolveAssetUrl } from '@/api/assets'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { BrandFormDialog } from '@/features/brands/BrandFormDialog'
import {
  useBrandsQuery,
  useCreateBrandMutation,
  useDeleteBrandMutation,
  useUpdateBrandMutation,
} from '@/features/brands/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { Brand, BrandFilters, BrandPayload } from '@/types/brand'

export default function BrandsPage() {
  const { t } = useTranslation(['brands', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null)

  const filters: BrandFilters = useMemo(
    () => ({
      search: search || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search]
  )

  const brandsQuery = useBrandsQuery(filters)
  const createBrand = useCreateBrandMutation()
  const updateBrand = useUpdateBrandMutation()
  const deleteBrand = useDeleteBrandMutation()

  const brands = brandsQuery.data?.data ?? []
  const meta = brandsQuery.data?.meta
  const canCreate = can('brands.create')
  const canEdit = can('brands.edit')
  const canDelete = can('brands.delete')

  const columns: EntityTableColumn<Brand>[] = useMemo(
    () => [
      {
        key: 'brand',
        label: t('columns.brand'),
        render: (brand) => (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Avatar variant="rounded" src={resolveAssetUrl(brand.image_url)}
              sx={{ width: 'var(--app-control-height)', height: 'var(--app-control-height)', borderRadius: 1, bgcolor: 'action.hover' }}>
              <ImageOutlined fontSize="small" />
            </Avatar>
            <Typography variant="subtitle2">{brand.name}</Typography>
          </Stack>
        ),
      },
      {
        key: 'description', label: t('columns.description'),
        render: (brand) => (
          <Typography variant="body2" sx={{ maxWidth: 460, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {brand.description || '-'}
          </Typography>
        ),
      },
      {
        key: 'products', label: t('columns.products'),
        render: (brand) => brand.products_count,
      },
    ],
    [t]
  )

  const openCreateForm = () => {
    setEditingBrand(null)
    setFormOpen(true)
  }

  const openEditForm = (brand: Brand) => {
    setEditingBrand(brand)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: BrandPayload) => {
    if (editingBrand) {
      await updateBrand.mutateAsync({ id: editingBrand.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createBrand.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingBrand) return

    try {
      await deleteBrand.mutateAsync(deletingBrand.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingBrand(null)
    } catch (error) {
      const apiError = toAppApiError(error)
      enqueueSnackbar(apiError.message, { variant: 'error' })
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<LocalOfferOutlined color="primary" />}
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
      />

      {brandsQuery.isError && (
        <Alert severity="error">{toAppApiError(brandsQuery.error).message}</Alert>
      )}

      <EntityTable
        rows={brands}
        columns={columns}
        getRowKey={(brand) => brand.id}
        loading={brandsQuery.isLoading}
        emptyIcon={<LocalOfferOutlined />}
        emptyTitle={t('empty')}
        emptyDescription="Try changing your filters or create a new brand."
        pagination={{
          page,
          rowsPerPage: perPage,
          count: meta?.total ?? 0,
          onPageChange: setPage,
          onRowsPerPageChange: (nextPerPage) => { setPerPage(nextPerPage); setPage(0) },
        }}
        rowActions={(brand) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deleteBrand.isPending}
            onEdit={() => openEditForm(brand)}
            onDelete={() => setDeletingBrand(brand)}
          />
        )}
      />

      <BrandFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingBrand?.id ?? 'new'}`}
        open={formOpen}
        brand={editingBrand}
        isSaving={createBrand.isPending || updateBrand.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingBrand}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingBrand?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteBrand.isPending}
        onClose={() => setDeletingBrand(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
