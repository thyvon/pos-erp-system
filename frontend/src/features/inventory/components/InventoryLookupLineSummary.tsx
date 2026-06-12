'use client'

import type { ReactNode } from 'react'
import { Chip, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface InventoryLookupLineSummaryProps {
  productLabel?: string | null
  fallbackLabel?: string | null
  sku?: string | null
  unitLabel?: string | null
  stockTracking?: string | null
  lotNumber?: string | null
  serialNumber?: string | null
  availableQuantity?: string | number | null
  conversion?: ReactNode
  statusChip?: ReactNode
}

function hasTracking(stockTracking?: string | null) {
  return Boolean(stockTracking && stockTracking !== 'none')
}

export function InventoryLookupLineSummary({
  productLabel,
  fallbackLabel,
  sku,
  unitLabel,
  stockTracking,
  lotNumber,
  serialNumber,
  availableQuantity,
  conversion,
  statusChip,
}: InventoryLookupLineSummaryProps) {
  const { t } = useTranslation('inventory')
  const detailParts = [
    lotNumber ? `${t('openingBalances.fields.lotNumber')}: ${lotNumber}` : null,
    serialNumber ? `${t('openingBalances.fields.serialNumber')}: ${serialNumber}` : null,
    availableQuantity !== null && availableQuantity !== undefined && availableQuantity !== ''
      ? t('lookup.available', { quantity: availableQuantity })
      : null,
  ].filter(Boolean)

  return (
    <Stack spacing={0.25}>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
        <Typography variant="body2">{productLabel || fallbackLabel || '-'}</Typography>
        {hasTracking(stockTracking) && (
          <Chip label={stockTracking} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
        )}
        {statusChip}
      </Stack>

      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {sku || '-'}
        </Typography>
        {conversion ?? (
          unitLabel ? (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              / {unitLabel}
            </Typography>
          ) : null
        )}
      </Stack>

      {detailParts.length > 0 && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {detailParts.join(' / ')}
        </Typography>
      )}
    </Stack>
  )
}
