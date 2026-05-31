'use client'

import {
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

export function PurchaseReturnLineTable({ items, lines, disabled = false, onChange }: PurchaseReturnLineTableProps) {
  const { t } = useTranslation('purchases')

  const updateLine = (itemId: string, changes: Partial<PurchaseReturnDraftLine>) => {
    onChange(lines.map((line) => (line.purchase_item_id === itemId ? { ...line, ...changes } : line)))
  }

  return (
    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
      <Table sx={{ minWidth: 800, tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 64 }}>{t('returns.columns.select')}</TableCell>
            <TableCell sx={{ width: 300 }}>{t('create.items.product')}</TableCell>
            <TableCell sx={{ width: 120 }} align="right">{t('returns.columns.received')}</TableCell>
            <TableCell sx={{ width: 150 }}>{t('returns.columns.lot')}</TableCell>
            <TableCell sx={{ width: 150 }} align="right">{t('returns.columns.returnQty')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const line = lineFor(lines, item.id)
            const receivedQty = toNumber(item.received_quantity ?? item.quantity)

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
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {item.variation?.sku ?? item.product?.sku ?? '-'}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{formatQuantity(receivedQty)}</Typography>
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder={t('returns.fields.lotPlaceholder')}
                    value={line?.lot_id ?? ''}
                    disabled={disabled || !line?.selected}
                    onChange={(event) => updateLine(item.id, { lot_id: event.target.value })}
                    slotProps={{ input: { 'aria-label': t('returns.fields.lotPlaceholder') } }}
                    fullWidth
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    size="small"
                    value={line?.quantity ?? 0}
                    disabled={disabled || !line?.selected}
                    onChange={(event) => updateLine(item.id, { quantity: Math.max(0, Number(event.target.value)) })}
                    slotProps={{
                      input: { inputProps: { min: 0, max: receivedQty, step: 'any' } },
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
