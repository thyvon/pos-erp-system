'use client'

import { CircularProgress, TableCell, TableRow, Typography } from '@mui/material'

interface TableStateRowProps {
  colSpan: number
  loading?: boolean
  message?: string
}

export function TableStateRow({ colSpan, loading = false, message }: TableStateRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 6 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {message}
          </Typography>
        )}
      </TableCell>
    </TableRow>
  )
}
