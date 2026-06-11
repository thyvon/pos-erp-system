'use client'

import { Controller, type Control, type FieldArrayWithId, type FieldErrors } from 'react-hook-form'
import {
  Button,
  Checkbox,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { UnitConversionBadge } from '@/features/sales/components/UnitConversionBadge'
import { DeleteOutlined, EditOutlined } from '@/components/ui/icons'
import { formatMoney } from '@/utils/formatMoney'
import type { ReceivePurchaseFormInput } from '../schema'

interface PurchaseReceiveItemsTableProps {
  fields: FieldArrayWithId<ReceivePurchaseFormInput, 'items', 'fieldId'>[]
  control: Control<ReceivePurchaseFormInput>
  errors: FieldErrors<ReceivePurchaseFormInput>
  selectedItemIds: Set<string>
  onSelectedItemIdsChange: (ids: Set<string>) => void
  onDetailItem: (index: number) => void
  onDeleteTarget: (target: { itemId: string; label: string; index: number } | null) => void
  t: (key: string, options?: Record<string, unknown>) => string
  columnSx: Record<string, { width: number; minWidth: number }>
  currencyFormatter: Intl.NumberFormat
}

export function PurchaseReceiveItemsTable({
  fields,
  control,
  errors,
  selectedItemIds,
  onSelectedItemIdsChange,
  onDetailItem,
  onDeleteTarget,
  t,
  columnSx,
  currencyFormatter,
}: PurchaseReceiveItemsTableProps) {
  return (
    <>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2">{t('receive.items')}</Typography>
        {selectedItemIds.size > 0 && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => onDeleteTarget({ itemId: '__bulk__', label: `${selectedItemIds.size} items`, index: -1 })}
          >
            {`${t('common:buttons.delete')} (${selectedItemIds.size})`}
          </Button>
        )}
      </Stack>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 1250, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={columnSx.checkbox} padding="checkbox">
                <Checkbox
                  checked={fields.length > 0 && selectedItemIds.size === fields.length}
                  indeterminate={selectedItemIds.size > 0 && selectedItemIds.size < fields.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSelectedItemIdsChange(new Set(fields.map((f) => String(f.fieldId))))
                    } else {
                      onSelectedItemIdsChange(new Set())
                    }
                  }}
                />
              </TableCell>
              <TableCell sx={columnSx.item}>{t('receive.item')}</TableCell>
              <TableCell sx={columnSx.unit}>{t('form.subUnit')}</TableCell>
              <TableCell sx={columnSx.unitCost} align="right">{t('form.unitCost')}</TableCell>
              <TableCell sx={columnSx.originalQty} align="center">{t('receive.originalQty')}</TableCell>
              <TableCell sx={columnSx.receivedQty} align="center">{t('receive.receivedQty')}</TableCell>
              <TableCell sx={columnSx.qty}>{t('receive.receiveQty')}</TableCell>
              <TableCell sx={columnSx.lot}>{t('receive.lot')}</TableCell>
              <TableCell sx={columnSx.serials}>{t('receive.serials')}</TableCell>
              <TableCell sx={columnSx.details} align="center">{t('common:buttons.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.fieldId}>
                <TableCell sx={columnSx.checkbox} padding="checkbox">
                  <Checkbox
                    checked={selectedItemIds.has(String(field.fieldId))}
                    onChange={(e) => {
                      const next = new Set(selectedItemIds)
                      if (e.target.checked) {
                        next.add(String(field.fieldId))
                      } else {
                        next.delete(String(field.fieldId))
                      }
                      onSelectedItemIdsChange(next)
                    }}
                  />
                </TableCell>
                <TableCell sx={columnSx.item}>
                  <Stack spacing={0.25}>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{field.product_label}</Typography>
                      {field.stock_tracking && field.stock_tracking !== 'none' && (
                        <Chip label={field.stock_tracking} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                      )}
                    </Stack>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {field.sku || '-'}
                      </Typography>
                      {field.sub_unit_id && field._conversion_factor ? (
                        <UnitConversionBadge
                          conversionFactor={field._conversion_factor}
                          baseUnitLabel={field._base_unit_label ?? ''}
                          subUnitLabel={field.sub_unit_label ?? ''}
                          quantity={Number(field.quantity)}
                        />
                      ) : field._base_unit_label ? (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          · {field._base_unit_label}
                        </Typography>
                      ) : null}
                    </Stack>
                  </Stack>
                </TableCell>
                <TableCell sx={columnSx.unit}>
                  {field.sub_unit_id ? (field.sub_unit_label ?? '-') : (field._base_unit_label ?? '-')}
                </TableCell>
                <TableCell sx={columnSx.unitCost} align="right">
                  <Typography variant="body2">
                    {formatMoney(field.unit_cost, currencyFormatter)}
                  </Typography>
                </TableCell>
                <TableCell sx={columnSx.originalQty} align="center">
                  <Typography variant="body2">{field.item_quantity}</Typography>
                </TableCell>
                <TableCell sx={columnSx.receivedQty} align="center">
                  <Typography variant="body2">{field.item_quantity - field.remaining_quantity}</Typography>
                </TableCell>
                <TableCell sx={columnSx.qty}>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field: f }) => (
                        <TextField
                          {...f}
                          type="number"
                          error={!!errors.items?.[index]?.quantity}
                          helperText={errors.items?.[index]?.quantity?.message}
                          slotProps={{ htmlInput: { min: 0, max: field.remaining_quantity, step: 0.0001 } }}
                        />
                      )}
                    />
                </TableCell>
                <TableCell sx={columnSx.lot}>
                  {field.stock_tracking === 'lot' ? (
                    <Controller
                      name={`items.${index}.lot_number`}
                      control={control}
                      render={({ field: f }) => (
                        <TextField
                          {...f}
                          value={f.value ?? ''}
                          label={t('receive.lot')}
                          error={!!errors.items?.[index]?.lot_number}
                          helperText={errors.items?.[index]?.lot_number?.message}
                        />
                      )}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>&mdash;</Typography>
                  )}
                </TableCell>
                <TableCell sx={columnSx.serials}>
                  {field.stock_tracking === 'serial' ? (
                    <Controller
                      name={`items.${index}.serial_numbers_text`}
                      control={control}
                      render={({ field: f }) => (
                        <TextField
                          {...f}
                          value={f.value ?? ''}
                          multiline
                          minRows={1}
                          maxRows={3}
                          placeholder={t('receive.serialsPlaceholder')}
                          error={!!errors.items?.[index]?.serial_numbers_text}
                          helperText={errors.items?.[index]?.serial_numbers_text?.message}
                          onPaste={(event: React.ClipboardEvent) => {
                            const pasted = event.clipboardData.getData('text')
                            const split = pasted.split(/[\r\n,;\t]+|  +/).map((s) => s.trim()).filter(Boolean)
                            if (split.length > 1) {
                              event.preventDefault()
                              const existing = (f.value ?? '').trim()
                              const merged = existing ? existing + '\n' + split.join('\n') : split.join('\n')
                              f.onChange(merged)
                            }
                          }}
                        />
                      )}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>&mdash;</Typography>
                  )}
                </TableCell>
                <TableCell sx={columnSx.details} align="center">
                  <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                    <Tooltip title={t('receive.itemDetails')}>
                      <IconButton
                        size="small"
                        onClick={() => onDetailItem(index)}
                      >
                        <EditOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common:buttons.delete')}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteTarget({ itemId: String(field.fieldId), label: field.product_label, index })}
                      >
                        <DeleteOutlined />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
