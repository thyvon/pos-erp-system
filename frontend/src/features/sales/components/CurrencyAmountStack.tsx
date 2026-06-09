'use client'

import { Stack, Typography } from '@mui/material'

type AmountDisplay = {
  usd: string
  khr: string
}

interface CurrencyAmountStackProps {
  amount: AmountDisplay
  color?: string
  primaryVariant?: 'body1' | 'h6' | 'h5'
  secondaryVariant?: 'body2' | 'body1'
}

function splitCurrencyLine(line: string) {
  const [currency, ...valueParts] = line.split(':')

  return {
    currency: currency.trim(),
    value: valueParts.join(':').trim(),
  }
}

export function CurrencyAmountStack({
  amount,
  color = 'text.primary',
  primaryVariant = 'body1',
  secondaryVariant = 'body2',
}: CurrencyAmountStackProps) {
  const lines = [splitCurrencyLine(amount.usd), splitCurrencyLine(amount.khr)]

  return (
    <Stack spacing={0.1} sx={{ alignItems: 'stretch', minWidth: 0 }}>
      {lines.map((line, index) => (
        <Stack
          key={line.currency}
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: 'baseline',
            display: 'grid',
            gridTemplateColumns: '34px minmax(0, 1fr)',
            columnGap: 0.75,
            minWidth: 0,
          }}
        >
          <Typography
            variant={index === 0 ? primaryVariant : secondaryVariant}
            sx={{ color, fontWeight: index === 0 ? 900 : 800, lineHeight: 1.15, textAlign: 'left' }}
            noWrap
          >
            {line.currency}
          </Typography>
          <Typography
            variant={index === 0 ? primaryVariant : secondaryVariant}
            sx={{ color, fontWeight: index === 0 ? 900 : 800, lineHeight: 1.15, minWidth: 0, textAlign: 'right' }}
            noWrap
          >
            {line.value}
          </Typography>
        </Stack>
      ))}
    </Stack>
  )
}
