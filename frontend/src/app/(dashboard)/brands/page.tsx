'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
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
import { Add, ImageOutlined, LocalOfferOutlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { BrandFormDialog } from '@/features/brands/BrandFormDialog'
import {
  useBrandsQuery,
  useCreateBrandMutation,
  useDeleteBrandMutation,
  useUpdateBrandMutation,
} from '@/features/brands/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { Brand, BrandFilters, BrandPayload } from '@/types/brand'

const rowsPerPageOptions = [10, 25, 50]

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
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <LocalOfferOutlined color="primary" />
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
          <TextField
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(0)
            }}
            placeholder={t('filters.search')}
            sx={{ mb: 2.5, width: '100%' }}
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

          {brandsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(brandsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.brand')}</TableCell>
                  <TableCell>{t('columns.description')}</TableCell>
                  <TableCell>{t('columns.products')}</TableCell>
                  <TableCell align="right">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {brandsQuery.isLoading && <TableStateRow colSpan={4} loading />}

                {!brandsQuery.isLoading && brands.length === 0 && (
                  <TableStateRow colSpan={4} message={t('empty')} />
                )}

                {brands.map((brand) => (
                  <TableRow key={brand.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <Avatar
                          variant="rounded"
                          src={brand.image_url ?? undefined}
                          sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: 'action.hover' }}
                        >
                          <ImageOutlined fontSize="small" />
                        </Avatar>
                        <Stack sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2">{brand.name}</Typography>
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 460,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {brand.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{brand.products_count}</TableCell>
                    <TableCell align="right">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteBrand.isPending}
                        onEdit={() => openEditForm(brand)}
                        onDelete={() => setDeletingBrand(brand)}
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
