'use client'

import { useState } from 'react'
import {
  Autocomplete,
  Box,
  TextField,
  Typography,
  Stack,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { inventoryApi } from '../api'
import { useInventoryProductLookupQuery } from '../hooks'
import type { InventoryProductLookupItem } from '@/types/inventory'

interface InventoryProductLookupPickerProps {
  warehouseId?: string
  disabled?: boolean
  label?: string
  helperText?: string
  onSelect: (item: InventoryProductLookupItem) => void
}

export function getInventoryLookupLabel(item: InventoryProductLookupItem) {
  const details = [item.sku, item.lot_number, item.serial_number].filter(Boolean).join(' / ')
  return details ? `${item.label} (${details})` : item.label
}

function normalize(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

function findExactLookupMatch(items: InventoryProductLookupItem[], term: string) {
  const normalizedTerm = normalize(term)

  if (!normalizedTerm) return null

  return items.find((item) => {
    if (item.is_exact_match) return true

    return [
      item.sku,
      item.serial_number,
      item.lot_number,
      item.product_name,
      item.variation_name,
    ].some((value) => normalize(value) === normalizedTerm)
  }) ?? null
}

export function InventoryProductLookupPicker({
  warehouseId,
  disabled = false,
  label,
  helperText,
  onSelect,
}: InventoryProductLookupPickerProps) {
  const { t } = useTranslation('inventory')
  const [inputValue, setInputValue] = useState('')
  const [isResolving, setIsResolving] = useState(false)
  const lookupQuery = useInventoryProductLookupQuery(inputValue, warehouseId)
  const options = lookupQuery.data ?? []

  const pickItem = (item: InventoryProductLookupItem | null) => {
    if (!item) return

    onSelect(item)
    setInputValue('')
  }

  const pickBestMatch = (items: InventoryProductLookupItem[]) => {
    const exactMatch = findExactLookupMatch(items, inputValue)

    if (exactMatch) {
      pickItem(exactMatch)
      return true
    }

    if (items.length === 1) {
      pickItem(items[0])
      return true
    }

    return false
  }

  const resolveSubmittedTerm = async () => {
    const term = inputValue.trim()

    if (term.length < 2 || pickBestMatch(options)) return

    setIsResolving(true)

    try {
      const results = await inventoryApi.productLookup({ q: term, warehouse_id: warehouseId })
      pickBestMatch(results)
    } finally {
      setIsResolving(false)
    }
  }

  return (
    <Autocomplete
      value={null}
      inputValue={inputValue}
      options={options}
      loading={lookupQuery.isFetching || isResolving}
      disabled={disabled}
      filterOptions={(items) => items}
      isOptionEqualToValue={(option, selected) => option.lookup_key === selected.lookup_key}
      getOptionLabel={getInventoryLookupLabel}
      onInputChange={(_, nextValue, reason) => {
        if (reason !== 'reset') setInputValue(nextValue)
      }}
      onChange={(_, nextValue) => pickItem(nextValue)}
      noOptionsText={inputValue.trim().length < 2 ? t('lookup.searchHint') : t('lookup.noProducts')}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.lookup_key}>
          <Stack spacing={0.25}>
            <Typography variant="body2">{getInventoryLookupLabel(option)}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('lookup.available', { quantity: option.available_quantity ?? '-' })}
            </Typography>
          </Stack>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label ?? t('lookup.label')}
          helperText={helperText}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void resolveSubmittedTerm()
            }
          }}
        />
      )}
    />
  )
}
