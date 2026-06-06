'use client'

import {
  Autocomplete,
  Checkbox,
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
import type { PurchaseItem } from '@/types/purchase'

export interface PurchaseReturnDraftLine {
  purchase_item_id: string
  selected: boolean
  quantity: number
  lot_id: string
  serial_ids: string[]
}

interface PurchaseReturnLineTableProps {
  items: PurchaseItem[]
  lines: PurchaseReturnDraftLine[]
  disabled?: boolean
  onChange: (lines: PurchaseReturnDraftLine[]) => void
}

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function formatQuantity(value: string | number | null | undefined) {
  const numeric = toNumber(value, NaN)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '-'
}

function itemLabel(item: PurchaseItem) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

function lineFor(lines: PurchaseReturnDraftLine[], itemId: string) {
  return lines.find((line) => line.purchase_item_id === itemId)
}

function lotLabel(lot: NonNullable<PurchaseItem['return_lots']>[number]) {
  return `${lot.lot_number} (${formatQuantity(lot.qty_on_hand)})`
}

export function PurchaseReturnLineTable({ items, lines, disabled = false, onChange }: PurchaseReturnLineTableProps) {
  const { t } = useTranslation('purchases')

  const updateLine = (itemId: string, changes: Partial<PurchaseReturnDraftLine>) => {
    onChange(lines.map((line) => (line.purchase_item_id === itemId ? { ...line, ...changes } : line)))
  }

  return (
    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
      <Table sx={{ minWidth: 1080, tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 64 }}>{t('returns.columns.select')}</TableCell>
            <TableCell sx={{ width: 300 }}>{t('create.items.product')}</TableCell>
            <TableCell sx={{ width: 120 }} align="right">{t('returns.columns.received')}</TableCell>
            <TableCell sx={{ width: 220 }}>{t('returns.columns.lot')}</TableCell>
            <TableCell sx={{ width: 240 }}>{t('returns.columns.serials')}</TableCell>
            <TableCell sx={{ width: 150 }} align="right">{t('returns.columns.returnQty')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const line = lineFor(lines, item.id)
            const receivedQty = toNumber(item.received_quantity ?? item.quantity)
            const tracking = item.product?.stock_tracking ?? 'none'
            const lotOptions = item.return_lots ?? []
            const serialOptions = item.return_serials ?? []
            const selectedLot = lotOptions.find((lot) => lot.id === line?.lot_id) ?? null
            const selectedSerials = serialOptions.filter((serial) => line?.serial_ids.includes(serial.id))
            const maxReturnQty = tracking === 'lot' && selectedLot
              ? Math.min(receivedQty, toNumber(selectedLot.qty_on_hand))
              : receivedQty

            return (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Checkbox
                    checked={!!line?.selected}
                    disabled={disabled}
                    onChange={(event) => updateLine(item.id, {
                      selected: event.target.checked,
                      quantity: tracking === 'serial' ? (line?.serial_ids.length ?? 0) : (line?.quantity ?? receivedQty),
                    })}
                    slotProps={{ input: { 'aria-label': t('returns.actions.selectLine') } }}
                  />
                </TableCell>
                <TableCell>
                  <Stack spacing={0.25}>
                    <Typography variant="subtitle2">{itemLabel(item)}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {item.variation?.sku ?? item.product?.sku ?? '-'}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{formatQuantity(receivedQty)}</Typography>
                </TableCell>
                <TableCell>
                  {tracking === 'lot' ? (
                    <Autocomplete
                      size="small"
                      options={lotOptions}
                      value={selectedLot}
                      disabled={disabled || !line?.selected}
                      getOptionLabel={lotLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onChange={(_, lot) => updateLine(item.id, {
                        lot_id: lot?.id ?? '',
                        quantity: Math.min(line?.quantity ?? receivedQty, lot ? toNumber(lot.qty_on_hand) : receivedQty),
                      })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={t('returns.fields.lotPlaceholder')}
                          helperText={lotOptions.length === 0 ? t('returns.fields.noLots') : undefined}
                        />
                      )}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {tracking === 'serial' ? (
                    <Autocomplete
                      multiple
                      size="small"
                      options={serialOptions}
                      value={selectedSerials}
                      disabled={disabled || !line?.selected}
                      getOptionLabel={(serial) => serial.serial_number}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onChange={(_, serials) => updateLine(item.id, {
                        serial_ids: serials.map((serial) => serial.id),
                        quantity: serials.length,
                      })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={t('returns.fields.serialsPlaceholder')}
                          helperText={serialOptions.length === 0 ? t('returns.fields.noSerials') : undefined}
                        />
                      )}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    size="small"
                    value={line?.quantity ?? 0}
                    disabled={disabled || !line?.selected || tracking === 'serial'}
                    onChange={(event) => updateLine(item.id, { quantity: Math.max(0, Math.min(maxReturnQty, Number(event.target.value))) })}
                    slotProps={{
                      input: { inputProps: { min: 0, max: maxReturnQty, step: 'any' } },
                      htmlInput: { 'aria-label': t('returns.fields.returnQty') },
                    }}
                    sx={{ width: 120 }}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
