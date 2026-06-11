'use client'

import { Box } from '@mui/material'

const CODE39_PATTERNS: Record<string, string> = {
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw',
  B: 'nnwnnwnnw',
  C: 'wnwnnwnnn',
  D: 'nnnnwwnnw',
  E: 'wnnnwwnnn',
  F: 'nnwnwwnnn',
  G: 'nnnnnwwnw',
  H: 'wnnnnwwnn',
  I: 'nnwnnwwnn',
  J: 'nnnnwwwnn',
  K: 'wnnnnnnww',
  L: 'nnwnnnnww',
  M: 'wnwnnnnwn',
  N: 'nnnnwnnww',
  O: 'wnnnwnnwn',
  P: 'nnwnwnnwn',
  Q: 'nnnnnnwww',
  R: 'wnnnnnwwn',
  S: 'nnwnnnwwn',
  T: 'nnnnwnwwn',
  U: 'wwnnnnnnw',
  V: 'nwwnnnnnw',
  W: 'wwwnnnnnn',
  X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw',
  '.': 'wwnnnnwnn',
  ' ': 'nwwnnnwnn',
  '$': 'nwnwnwnnn',
  '/': 'nwnwnnnwn',
  '+': 'nwnnnwnwn',
  '%': 'nnnwnwnwn',
  '*': 'nwnnwnwnn',
}

function normalizeCode39(value: string) {
  return value
    .toUpperCase()
    .replace(/[^0-9A-Z ./$+%-]/g, '-')
    .slice(0, 48)
}

function barcodeRuns(value: string) {
  const encoded = `*${normalizeCode39(value || 'LABEL')}*`
  const runs: Array<{ black: boolean; width: number }> = []

  for (const char of encoded) {
    const pattern = CODE39_PATTERNS[char] ?? CODE39_PATTERNS['-']
    pattern.split('').forEach((width, index) => {
      runs.push({ black: index % 2 === 0, width: width === 'w' ? 3 : 1 })
    })
    runs.push({ black: false, width: 1 })
  }

  return runs
}

interface Code39BarcodeProps {
  value: string
  height?: number
  showText?: boolean
}

export function Code39Barcode({ value, height = 34, showText = true }: Code39BarcodeProps) {
  const runs = barcodeRuns(value)
  const totalWidth = runs.reduce((sum, run) => sum + run.width, 0)
  const bars: Array<{ key: string; x: number; width: number }> = []
  let cursor = 0

  runs.forEach((run, index) => {
    if (run.black) {
      bars.push({ key: `${index}-${cursor}`, x: cursor, width: run.width })
    }
    cursor += run.width
  })

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height + (showText ? 12 : 0)}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={value}
        style={{ display: 'block', width: '100%', height: showText ? height + 12 : height }}
      >
        <rect x="0" y="0" width={totalWidth} height={height} fill="#fff" />
        {bars.map((bar) => (
          <rect key={bar.key} x={bar.x} y="0" width={bar.width} height={height} fill="#111" />
        ))}
        {showText && (
          <text
            x={totalWidth / 2}
            y={height + 9}
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontSize="8"
            fill="#111"
          >
            {normalizeCode39(value || 'LABEL')}
          </text>
        )}
      </svg>
    </Box>
  )
}
