'use client'

import { Chip } from '@mui/material'

interface UnitConversionBadgeProps {
  conversionFactor: string
  baseUnitLabel: string
  subUnitLabel: string
  quantity: number
}

export function UnitConversionBadge({
  conversionFactor,
  baseUnitLabel,
  subUnitLabel,
  quantity,
}: UnitConversionBadgeProps) {
  const cf = Number(conversionFactor)
  const baseQty = quantity * cf
  const cfLabel = Number.isInteger(cf) ? cf.toFixed(0) : cf.toFixed(2)
  const totalLabel = Number.isInteger(baseQty) ? baseQty.toFixed(0) : baseQty.toFixed(2)

  return (
    <Chip
      label={`${cfLabel}${baseUnitLabel}/${subUnitLabel} (${totalLabel} ${baseUnitLabel})`}
      size="small"
      variant="outlined"
      sx={{ height: 20, '& .MuiChip-label': { px: 0.75, fontSize: '0.6875rem' } }}
    />
  )
}
