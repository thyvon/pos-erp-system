'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { Inventory2Outlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import {
  useInventoryOptionsQuery,
  useStockLevelQuery,
  useStockLevelsQuery,
} from '@/features/inventory/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { formatAppDateTime } from '@/utils/dateFormat'
import type { StockLevel, StockLevelFilters } from '@/types/inventory'

function formatQuantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(value)
}

function productLabel(level: StockLevel) {
  return [
    level.product?.name,
    level.variation?.name,
  ].filter(Boolean).join(' / ') || '-'
}

export default function StockLevelsPage() {
  const { t, i18n } = useTranslation(['inventory'])
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [viewingLevel, setViewingLevel] = useState<StockLevel | null>(null)

  const filters: StockLevelFilters = useMemo(
    () => ({
      search: search || undefined,
      warehouse_id: warehouseFilter || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search, warehouseFilter]
  )

  const optionsQuery = useInventoryOptionsQuery()
  const stockLevelsQuery = useStockLevelsQuery(filters)
  const detailQuery = useStockLevelQuery(viewingLevel?.id ?? null)
  const dateFormat = useAppDateFormat()
  const stockLevels = stockLevelsQuery.data?.data ?? []
  const warehouses = optionsQuery.data?.warehouses ?? []
  const meta = stockLevelsQuery.data?.meta
  const selectedLevel = detailQuery.data ?? viewingLevel

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(0)
  }, [])

  const handleWarehouseChange = useCallback((value: string) => {
    setWarehouseFilter(value)
    setPage(0)
  }, [])

  const clearFilters = useCallback(() => {
    setWarehouseFilter('')
    setPage(0)
  }, [])

  const selectedWarehouse = warehouses.find((w) => w.id === warehouseFilter)

  const activeFilters = useMemo(() => {
    const chips: Array<{ key: string; label: string; onDelete: () => void }> = []
    if (warehouseFilter && selectedWarehouse) {
      chips.push({
        key: 'warehouse',
        label: selectedWarehouse.name,
        onDelete: () => { setWarehouseFilter(''); setPage(0) },
      })
    }
    return chips
  }, [warehouseFilter, selectedWarehouse])

  const columns: EntityTableColumn<StockLevel>[] = useMemo(() => [
    {
      key: 'product',
      label: t('stockLevels.columns.product'),
      render: (level) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{productLabel(level)}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {level.variation?.sku ?? level.product?.sku ?? '-'}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'warehouse',
      label: t('stockLevels.columns.warehouse'),
      render: (level) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{level.warehouse?.name ?? '-'}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {level.warehouse?.branch_name ?? '-'}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'onHand',
      label: t('stockLevels.columns.onHand'),
      align: 'right',
      render: (level) => <>{formatQuantity(level.quantity)}</>,
    },
    {
      key: 'reserved',
      label: t('stockLevels.columns.reserved'),
      align: 'right',
      render: (level) => <>{formatQuantity(level.reserved_quantity)}</>,
    },
    {
      key: 'available',
      label: t('stockLevels.columns.available'),
      align: 'right',
      render: (level) => <>{formatQuantity(level.available_qty)}</>,
    },
    {
      key: 'updatedAt',
      label: t('stockLevels.columns.updatedAt'),
      render: (level) => <>{formatAppDateTime(level.updated_at, dateFormat, i18n.language)}</>,
    },
  ], [t, dateFormat, i18n.language])

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<Inventory2Outlined color="primary" />}
        title={t('stockLevels.title')}
        description={t('stockLevels.subtitle')}
      />

      {(stockLevelsQuery.isError || optionsQuery.isError) && (
        <Stack spacing={1}>
          {stockLevelsQuery.isError && (
            <Alert severity="error">{toAppApiError(stockLevelsQuery.error).message}</Alert>
          )}
          {optionsQuery.isError && (
            <Alert severity="error">{toAppApiError(optionsQuery.error).message}</Alert>
          )}
        </Stack>
      )}

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('stockLevels.filters.search')}
        onSearchChange={handleSearchChange}
        activeFilters={activeFilters}
        onClearFilters={clearFilters}
        filterButtonLabel={t('stockLevels.filters.warehouse')}
        filters={
          <SearchableFilterSelect
            value={warehouseFilter}
            options={warehouses}
            loading={optionsQuery.isLoading}
            label={t('stockLevels.filters.warehouse')}
            placeholder={t('stockLevels.filters.allWarehouses')}
            getOptionValue={(warehouse) => warehouse.id}
            getOptionLabel={(warehouse) => warehouse.name}
            getOptionDescription={(warehouse) => [warehouse.code, warehouse.branch_name].filter(Boolean).join(' / ')}
            onChange={handleWarehouseChange}
          />
        }
      />

      <EntityTable
        rows={stockLevels}
        columns={columns}
        getRowKey={(level) => level.id}
        loading={stockLevelsQuery.isLoading}
        emptyIcon={<Inventory2Outlined />}
        emptyTitle={t('stockLevels.empty')}
        emptyDescription=""
        pagination={{
          page,
          rowsPerPage: perPage,
          count: meta?.total ?? 0,
          onPageChange: (newPage) => setPage(newPage),
          onRowsPerPageChange: (newRowsPerPage) => {
            setPerPage(newRowsPerPage)
            setPage(0)
          },
        }}
        rowActions={(level) => (
          <RowActions
            viewLabel={t('stockLevels.actions.view')}
            editLabel=""
            deleteLabel=""
            showView
            showEdit={false}
            showDelete={false}
            onView={() => setViewingLevel(level)}
          />
        )}
      />

      <Dialog open={!!viewingLevel} onClose={() => setViewingLevel(null)} fullWidth maxWidth="md">
        <DialogTitle>{selectedLevel ? productLabel(selectedLevel) : t('stockLevels.detail.title')}</DialogTitle>
        <DialogContent dividers>
          {detailQuery.isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}
          {detailQuery.isError && (
            <Alert severity="error">{toAppApiError(detailQuery.error).message}</Alert>
          )}
          {selectedLevel && !detailQuery.isLoading && (
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('stockLevels.columns.product')}
                  </Typography>
                  <Typography variant="body2">{productLabel(selectedLevel)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('stockLevels.columns.sku')}
                  </Typography>
                  <Typography variant="body2">{selectedLevel.variation?.sku ?? selectedLevel.product?.sku ?? '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('stockLevels.columns.warehouse')}
                  </Typography>
                  <Typography variant="body2">{selectedLevel.warehouse?.name ?? '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('stockLevels.columns.onHand')}
                  </Typography>
                  <Typography variant="body2">{formatQuantity(selectedLevel.quantity)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('stockLevels.columns.reserved')}
                  </Typography>
                  <Typography variant="body2">{formatQuantity(selectedLevel.reserved_quantity)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('stockLevels.columns.available')}
                  </Typography>
                  <Typography variant="body2">{formatQuantity(selectedLevel.available_qty)}</Typography>
                </Box>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('stockLevels.columns.updatedAt')}
                </Typography>
                <Typography variant="body2">{formatAppDateTime(selectedLevel.updated_at, dateFormat, i18n.language)}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  )
}
