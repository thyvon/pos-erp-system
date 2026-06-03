'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
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
import { Inventory2Outlined, Search } from '@/components/ui/icons'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { TableStateRow } from '@/components/ui/TableStateRow'
import {
  useInventoryOptionsQuery,
  useStockLevelQuery,
  useStockLevelsQuery,
} from '@/features/inventory/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { formatAppDateTime } from '@/utils/dateFormat'
import type { StockLevel, StockLevelFilters } from '@/types/inventory'

const rowsPerPageOptions = [10, 25, 50]

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

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Inventory2Outlined color="primary" />
          <Typography variant="h4">{t('stockLevels.title')}</Typography>
        </Stack>
        <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
          {t('stockLevels.subtitle')}
        </Typography>
      </Box>

      <Card>
        <CardContent>
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
              placeholder={t('stockLevels.filters.search')}
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
            <SearchableFilterSelect
              value={warehouseFilter}
              options={warehouses}
              loading={optionsQuery.isLoading}
              label={t('stockLevels.filters.warehouse')}
              placeholder={t('stockLevels.filters.allWarehouses')}
              getOptionValue={(warehouse) => warehouse.id}
              getOptionLabel={(warehouse) => warehouse.name}
              getOptionDescription={(warehouse) => [warehouse.code, warehouse.branch_name].filter(Boolean).join(' / ')}
              onChange={(value) => {
                setWarehouseFilter(value)
                setPage(0)
              }}
              sx={{ minWidth: { xs: '100%', lg: 240 } }}
            />
          </Stack>

          {stockLevelsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(stockLevelsQuery.error).message}
            </Alert>
          )}

          {optionsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(optionsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('stockLevels.columns.product')}</TableCell>
                  <TableCell>{t('stockLevels.columns.warehouse')}</TableCell>
                  <TableCell align="right">{t('stockLevels.columns.onHand')}</TableCell>
                  <TableCell align="right">{t('stockLevels.columns.reserved')}</TableCell>
                  <TableCell align="right">{t('stockLevels.columns.available')}</TableCell>
                  <TableCell>{t('stockLevels.columns.updatedAt')}</TableCell>
                  <TableCell align="center">{t('stockLevels.columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stockLevelsQuery.isLoading && <TableStateRow colSpan={7} loading />}

                {!stockLevelsQuery.isLoading && stockLevels.length === 0 && (
                  <TableStateRow colSpan={7} message={t('stockLevels.empty')} />
                )}

                {stockLevels.map((level) => (
                  <TableRow key={level.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{productLabel(level)}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {level.variation?.sku ?? level.product?.sku ?? '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{level.warehouse?.name ?? '-'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {level.warehouse?.branch_name ?? '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{formatQuantity(level.quantity)}</TableCell>
                    <TableCell align="right">{formatQuantity(level.reserved_quantity)}</TableCell>
                    <TableCell align="right">{formatQuantity(level.available_qty)}</TableCell>
                    <TableCell>{formatAppDateTime(level.updated_at, dateFormat, i18n.language)}</TableCell>
                    <TableCell align="center">
                      <RowActions
                        viewLabel={t('stockLevels.actions.view')}
                        editLabel=""
                        deleteLabel=""
                        showView
                        showEdit={false}
                        showDelete={false}
                        onView={() => setViewingLevel(level)}
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
