'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Add, Inventory2Outlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import {
  useDeleteProductMutation,
  useProductsQuery,
} from '@/features/products/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { Product, ProductFilters, ProductType, StockTracking } from '@/types/product'

const rowsPerPageOptions = [10, 25, 50]
const productTypes: Array<ProductType | ''> = ['', 'single', 'variable', 'service', 'combo']
const stockTrackingOptions: Array<StockTracking | ''> = ['', 'none', 'lot', 'serial']

export default function ProductsPage() {
  const { t } = useTranslation(['products', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [type, setType] = useState<ProductType | ''>('')
  const [stockTracking, setStockTracking] = useState<StockTracking | ''>('')
  const [isActive, setIsActive] = useState<boolean | ''>('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  const filters: ProductFilters = useMemo(
    () => ({
      search: search || undefined,
      type,
      stock_tracking: stockTracking,
      is_active: isActive,
      page: page + 1,
      per_page: perPage,
    }),
    [isActive, page, perPage, search, stockTracking, type]
  )

  const productsQuery = useProductsQuery(filters)
  const deleteProduct = useDeleteProductMutation()

  const products = productsQuery.data?.data ?? []
  const meta = productsQuery.data?.meta
  const canCreate = can('products.create')
  const canView = can('products.index')
  const canEdit = can('products.edit')
  const canDelete = can('products.delete')

  const handleDelete = async () => {
    if (!deletingProduct) return

    try {
      await deleteProduct.mutateAsync(deletingProduct.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingProduct(null)
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
            <Inventory2Outlined color="primary" />
            <Typography variant="h4">{t('title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('subtitle')}
          </Typography>
        </Box>
        {canCreate && (
          <Button startIcon={<Add />} variant="contained" onClick={() => router.push('/products/create')}>
            {t('actions.new')}
          </Button>
        )}
      </Stack>

      <Card>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', lg: 'center' }, mb: 2.5 }}
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
            <TextField select value={type} label={t('filters.type')} onChange={(event) => {
              setType(event.target.value as ProductType | '')
              setPage(0)
            }} sx={{ minWidth: 180 }}>
              {productTypes.map((item) => <MenuItem key={item || 'all'} value={item}>{item ? t(`types.${item}`) : t('filters.allTypes')}</MenuItem>)}
            </TextField>
            <TextField select value={stockTracking} label={t('filters.stockTracking')} onChange={(event) => {
              setStockTracking(event.target.value as StockTracking | '')
              setPage(0)
            }} sx={{ minWidth: 190 }}>
              {stockTrackingOptions.map((item) => <MenuItem key={item || 'all'} value={item}>{item ? t(`stockTracking.${item}`) : t('filters.allTracking')}</MenuItem>)}
            </TextField>
            <TextField select value={isActive === '' ? '' : String(isActive)} label={t('filters.status')} onChange={(event) => {
              setIsActive(event.target.value === '' ? '' : event.target.value === 'true')
              setPage(0)
            }} sx={{ minWidth: 160 }}>
              <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
              <MenuItem value="true">{t('common:status.active')}</MenuItem>
              <MenuItem value="false">{t('common:status.inactive')}</MenuItem>
            </TextField>
          </Stack>

          {productsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>{toAppApiError(productsQuery.error).message}</Alert>
          )}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.product')}</TableCell>
                  <TableCell>{t('columns.type')}</TableCell>
                  <TableCell>{t('columns.price')}</TableCell>
                  <TableCell>{t('columns.category')}</TableCell>
                  <TableCell>{t('columns.inventory')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell align="center">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productsQuery.isLoading && <TableStateRow colSpan={7} loading />}
                {!productsQuery.isLoading && products.length === 0 && <TableStateRow colSpan={7} message={t('empty')} />}
                {products.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2">{product.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{product.sku || t('labels.noSku')}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={t(`types.${product.type}`)} />
                    </TableCell>
                    <TableCell>{formatPrice(product)}</TableCell>
                    <TableCell>{product.category?.name ?? '-'}</TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">{t(`stockTracking.${product.stock_tracking}`)}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {product.track_inventory ? t('labels.tracked') : t('labels.notTracked')}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={product.is_active ? t('common:status.active') : t('common:status.inactive')}
                        color={product.is_active ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <RowActions
                        viewLabel={t('actions.view')}
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showView={canView}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteProduct.isPending}
                        onView={() => router.push(`/products/${product.id}`)}
                        onEdit={() => router.push(`/products/${product.id}/edit`)}
                        onDelete={() => setDeletingProduct(product)}
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

      <ConfirmDialog
        open={!!deletingProduct}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingProduct?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteProduct.isPending}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}

function formatPrice(product: Product) {
  if (product.type === 'variable') {
    const min = product.selling_price ?? '-'
    return min
  }

  return product.selling_price ?? '-'
}
