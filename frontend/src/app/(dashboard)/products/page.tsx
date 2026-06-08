'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Add, Inventory2Outlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import {
  useDeleteProductMutation,
  useProductsQuery,
} from '@/features/products/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { Product, ProductFilters, ProductType, StockTracking } from '@/types/product'

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

  const activeFilters = useMemo(() => {
    const items: Array<{ key: string; label: string; onDelete: () => void }> = []

    if (type) {
      items.push({
        key: 'type',
        label: `${t('filters.type')}: ${t(`types.${type}`)}`,
        onDelete: () => {
          setType('')
          setPage(0)
        },
      })
    }

    if (stockTracking) {
      items.push({
        key: 'stock_tracking',
        label: `${t('filters.stockTracking')}: ${t(`stockTracking.${stockTracking}`)}`,
        onDelete: () => {
          setStockTracking('')
          setPage(0)
        },
      })
    }

    if (isActive !== '') {
      items.push({
        key: 'status',
        label: `${t('filters.status')}: ${isActive ? t('common:status.active') : t('common:status.inactive')}`,
        onDelete: () => {
          setIsActive('')
          setPage(0)
        },
      })
    }

    return items
  }, [isActive, stockTracking, t, type])

  const columns: EntityTableColumn<Product>[] = useMemo(
    () => [
      {
        key: 'product',
        label: t('columns.product'),
        render: (product) => (
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{product.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{product.sku || t('labels.noSku')}</Typography>
          </Stack>
        ),
      },
      {
        key: 'type',
        label: t('columns.type'),
        render: (product) => <Chip size="small" variant="outlined" label={t(`types.${product.type}`)} />,
      },
      {
        key: 'price',
        label: t('columns.price'),
        render: (product) => formatPrice(product),
      },
      {
        key: 'category',
        label: t('columns.category'),
        render: (product) => product.category?.name ?? '-',
      },
      {
        key: 'inventory',
        label: t('columns.inventory'),
        render: (product) => (
          <Stack spacing={0.5}>
            <Typography variant="body2">{t(`stockTracking.${product.stock_tracking}`)}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {product.track_inventory ? t('labels.tracked') : t('labels.notTracked')}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'status',
        label: t('columns.status'),
        render: (product) => (
          <Chip
            size="small"
            label={product.is_active ? t('common:status.active') : t('common:status.inactive')}
            color={product.is_active ? 'success' : 'default'}
            variant="outlined"
          />
        ),
      },
    ],
    [t]
  )

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

  const clearFilters = () => {
    setType('')
    setStockTracking('')
    setIsActive('')
    setPage(0)
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        eyebrow="Catalog"
        title={t('title')}
        description={t('subtitle')}
        actions={canCreate && (
          <Button startIcon={<Add />} variant="contained" onClick={() => router.push('/products/create')}>
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
        filters={
          <>
            <TextField
              select
              value={type}
              label={t('filters.type')}
              onChange={(event) => {
                setType(event.target.value as ProductType | '')
                setPage(0)
              }}
              sx={{ minWidth: 180 }}
            >
              {productTypes.map((item) => <MenuItem key={item || 'all'} value={item}>{item ? t(`types.${item}`) : t('filters.allTypes')}</MenuItem>)}
            </TextField>
            <TextField
              select
              value={stockTracking}
              label={t('filters.stockTracking')}
              onChange={(event) => {
                setStockTracking(event.target.value as StockTracking | '')
                setPage(0)
              }}
              sx={{ minWidth: 190 }}
            >
              {stockTrackingOptions.map((item) => <MenuItem key={item || 'all'} value={item}>{item ? t(`stockTracking.${item}`) : t('filters.allTracking')}</MenuItem>)}
            </TextField>
            <TextField
              select
              value={isActive === '' ? '' : String(isActive)}
              label={t('filters.status')}
              onChange={(event) => {
                setIsActive(event.target.value === '' ? '' : event.target.value === 'true')
                setPage(0)
              }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
              <MenuItem value="true">{t('common:status.active')}</MenuItem>
              <MenuItem value="false">{t('common:status.inactive')}</MenuItem>
            </TextField>
          </>
        }
        activeFilters={activeFilters}
        onClearFilters={activeFilters.length > 0 ? clearFilters : undefined}
      />

      {productsQuery.isError && (
        <Alert severity="error">{toAppApiError(productsQuery.error).message}</Alert>
      )}

      <EntityTable
        rows={products}
        columns={columns}
        getRowKey={(product) => product.id}
        loading={productsQuery.isLoading}
        emptyIcon={<Inventory2Outlined />}
        emptyTitle={t('empty')}
        emptyDescription="Create your first product or adjust the current filters."
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
        rowActions={(product) => (
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
        )}
      />

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
