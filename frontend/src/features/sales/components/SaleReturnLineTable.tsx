'use client'

import {
  Autocomplete,
  Checkbox,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { UnitConversionBadge } from '@/features/sales/components/UnitConversionBadge'
import { toNumber } from '@/features/sales/formHelpers'
import type { SaleItem } from '@/types/sales'

export interface SaleReturnDraftLine {
  sale_item_id: string
  selected: boolean
  quantity: number
  lot_id: string
  serial_ids: string[]
}

interface SaleReturnLineTableProps {
  items: SaleItem[]
  lines: SaleReturnDraftLine[]
  disabled?: boolean
  onChange: (lines: SaleReturnDraftLine[]) => void
}

function formatQuantity(value: string | number | null | undefined) {
  const numeric = toNumber(value, NaN)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '-'
}

function itemLabel(item: SaleItem) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

function lineFor(lines: SaleReturnDraftLine[], itemId: string) {
  return lines.find((line) => line.sale_item_id === itemId)
}

export function SaleReturnLineTable({ items, lines, disabled = false, onChange }: SaleReturnLineTableProps) {
  const { t } = useTranslation('sales')

  const updateLine = (itemId: string, changes: Partial<SaleReturnDraftLine>) => {
    onChange(lines.map((line) => (line.sale_item_id === itemId ? { ...line, ...changes } : line)))
  }

  return (
    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
      <Table sx={{ minWidth: 980, tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 64 }}>{t('returns.columns.select')}</TableCell>
            <TableCell sx={{ width: 300 }}>{t('items.product')}</TableCell>
            <TableCell sx={{ width: 120 }} align="right">{t('returns.columns.sold')}</TableCell>
            <TableCell sx={{ width: 150 }}>{t('returns.columns.lot')}</TableCell>
            <TableCell sx={{ width: 240 }}>{t('returns.columns.serials')}</TableCell>
            <TableCell sx={{ width: 150 }} align="right">{t('returns.columns.returnQty')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const line = lineFor(lines, item.id)
            const serialOptions = item.serials ?? []
            const lotOptions = item.lots ?? []
            const isSerialTracked = serialOptions.length > 0
            const isLotTracked = lotOptions.length > 0

            return (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Checkbox
                    checked={!!line?.selected}
                    disabled={disabled}
                    onChange={(event) => updateLine(item.id, { selected: event.target.checked })}
                    slotProps={{ input: { 'aria-label': t('returns.actions.selectLine') } }}
                  />
                </TableCell>
                <TableCell>
                  <Stack spacing={0.25}>
                    <Typography variant="subtitle2">{itemLabel(item)}</Typography>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {item.variation?.sku ?? item.product?.sku ?? '-'}
                      </Typography>
                      {item.sub_unit_id && item.sub_unit?.conversion_factor ? (
                        <UnitConversionBadge
                          conversionFactor={item.sub_unit.conversion_factor}
                          baseUnitLabel={item.product?.unit?.short_name ?? ''}
                          subUnitLabel={item.sub_unit.short_name ?? ''}
                          quantity={Number(item.quantity ?? 0)}
                        />
                      ) : item.product?.unit?.short_name ? (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          · {item.product.unit.short_name}
                        </Typography>
                      ) : null}
                    </Stack>
                  </Stack>
                </TableCell>
                <TableCell align="right">{formatQuantity(item.quantity)}</TableCell>
                <TableCell>
                  {isLotTracked ? (
                    <TextField
                      select
                      value={line?.lot_id ?? ''}
                      disabled={disabled || !line?.selected}
                      onChange={(event) => updateLine(item.id, { lot_id: event.target.value })}
                      fullWidth
                    >
                      <MenuItem value="">{t('returns.form.autoLot')}</MenuItem>
                      {lotOptions.map((lotLink) => (
                        <MenuItem key={lotLink.lot_id} value={lotLink.lot_id}>
                          {lotLink.lot?.lot_number ?? lotLink.lot_id}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {isSerialTracked ? (
                    <Autocomplete
                      multiple
                      size="small"
                      disableCloseOnSelect
                      disabled={disabled || !line?.selected}
                      options={serialOptions}
                      value={serialOptions.filter((serialLink) => line?.serial_ids.includes(serialLink.serial_id))}
                      getOptionLabel={(option) => option.serial?.serial_number ?? option.serial_id}
                      onChange={(_, value) => {
                        updateLine(item.id, {
                          serial_ids: value.map((serialLink) => serialLink.serial_id),
                          quantity: value.length,
                        })
                      }}
                      renderInput={(params) => (
                        <TextField {...params} placeholder={t('returns.form.selectSerials')} />
                      )}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    value={line?.quantity ?? 0}
                    disabled={disabled || !line?.selected || isSerialTracked}
                    onChange={(event) => updateLine(item.id, { quantity: toNumber(event.target.value) })}
                    slotProps={{
                      htmlInput: {
                        min: 0,
                        max: toNumber(item.quantity),
                        step: 0.0001,
                        style: { textAlign: 'right' },
                      },
                    }}
                  />
                </TableCell>
              </TableRow>
            )
          })}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                {t('detail.noItems')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
