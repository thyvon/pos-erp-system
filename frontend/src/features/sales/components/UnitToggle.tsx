'use client'

import { Select, MenuItem, Typography } from '@mui/material'

interface UnitToggleProps {
  subUnitOptionId: string | null
  currentSubUnitId: string | null
  baseUnitLabel: string | null
  subUnitLabel: string | null
  baseUnitPrice: number
  subUnitPrice: number
  disabled?: boolean
  onChange: (subUnitId: string | null, unitLabel: string, unitPrice: number) => void
}

export function UnitToggle({
  subUnitOptionId,
  currentSubUnitId,
  baseUnitLabel,
  subUnitLabel,
  baseUnitPrice,
  subUnitPrice,
  disabled,
  onChange,
}: UnitToggleProps) {
  if (!subUnitOptionId) {
    return (
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {baseUnitLabel || '-'}
      </Typography>
    )
  }

  return (
    <Select
      fullWidth
      value={currentSubUnitId === subUnitOptionId ? subUnitOptionId : '__none__'}
      onChange={(e) => {
        const val = e.target.value
        if (val === '__none__') {
          onChange(null, baseUnitLabel ?? '', baseUnitPrice)
        } else {
          onChange(subUnitOptionId, subUnitLabel ?? baseUnitLabel ?? '', subUnitPrice)
        }
      }}
      disabled={disabled}
    >
      <MenuItem value="__none__">{baseUnitLabel || '-'}</MenuItem>
      <MenuItem value={subUnitOptionId}>{subUnitLabel || '-'}</MenuItem>
    </Select>
  )
}
