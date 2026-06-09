import { ReactNode } from 'react'
import {
  Checkbox,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import EmptyState from './EmptyState'
import { getListSurfaceSx } from './surfaceStyles'

export interface EntityTableColumn<T> {
  key: string
  label: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  render?: (row: T, index: number) => ReactNode
}

interface EntityTableProps<T> {
  rows: T[]
  columns: EntityTableColumn<T>[]
  getRowKey: (row: T, index: number) => string | number
  loading?: boolean
  emptyIcon?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  selectedKeys?: Array<string | number>
  onSelectRow?: (key: string | number, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
  rowActions?: (row: T, index: number) => ReactNode
  pagination?: {
    page: number
    rowsPerPage: number
    count: number
    onPageChange: (page: number) => void
    onRowsPerPageChange: (rowsPerPage: number) => void
  }
  dense?: boolean
}

export default function EntityTable<T>({
  rows,
  columns,
  getRowKey,
  loading = false,
  emptyIcon,
  emptyTitle = 'No records found',
  emptyDescription = 'Try changing your filters or create a new record.',
  emptyAction,
  selectedKeys = [],
  onSelectRow,
  onSelectAll,
  rowActions,
  pagination,
  dense = false,
}: EntityTableProps<T>) {
  const selectable = Boolean(onSelectRow)
  const selectedSet = new Set(selectedKeys)
  const allVisibleSelected = rows.length > 0 && rows.every((row, index) => selectedSet.has(getRowKey(row, index)))
  const someVisibleSelected = rows.some((row, index) => selectedSet.has(getRowKey(row, index)))
  const columnCount = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        ...getListSurfaceSx(theme),
        overflow: 'hidden',
      })}
    >
      <TableContainer sx={{ borderRadius: 'inherit' }}>
        <Table size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={allVisibleSelected}
                    indeterminate={!allVisibleSelected && someVisibleSelected}
                    disabled={loading}
                    onChange={(event) => onSelectAll?.(event.target.checked)}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align ?? 'left'}
                  sx={{
                    width: column.width,
                    whiteSpace: 'nowrap',
                    fontWeight: 800,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
              {rowActions && (
                <TableCell align="right" sx={{ width: 72, fontWeight: 800 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columnCount} sx={{ borderBottom: 0, py: { xs: 5, sm: 7 } }}>
                  <Stack spacing={1.25} sx={{ alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress size={30} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Loading records...
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} sx={{ borderBottom: 0, p: { xs: 2, sm: 3 } }}>
                  <EmptyState
                    compact
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => {
                const rowKey = getRowKey(row, index)
                const selected = selectedSet.has(rowKey)

                return (
                  <TableRow
                    key={rowKey}
                    selected={selected}
                    hover
                    sx={{
                      '&:last-of-type td': { borderBottom: 0 },
                    }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selected}
                          onChange={(event) => onSelectRow?.(rowKey, event.target.checked)}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.key} align={column.align ?? 'left'}>
                        {column.render ? column.render(row, index) : String((row as Record<string, unknown>)[column.key] ?? '')}
                      </TableCell>
                    ))}
                    {rowActions && (
                      <TableCell align="right">
                        {rowActions(row, index)}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && rows.length > 0 && !loading && (
        <TablePagination
          component="div"
          page={pagination.page}
          count={pagination.count}
          rowsPerPage={pagination.rowsPerPage}
          onPageChange={(_, page) => pagination.onPageChange(page)}
          onRowsPerPageChange={(event) => pagination.onRowsPerPageChange(Number(event.target.value))}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      )}
    </Paper>
  )
}

export function EntityRowActionButton({ title, children, onClick }: { title: string; children: ReactNode; onClick?: () => void }) {
  return (
    <Tooltip title={title}>
      <IconButton size="small" onClick={onClick}>
        {children}
      </IconButton>
    </Tooltip>
  )
}
