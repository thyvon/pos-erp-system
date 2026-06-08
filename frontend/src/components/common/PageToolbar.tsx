import { ReactNode } from 'react'
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  alpha,
} from '@mui/material'
import { Search } from '@/components/ui/icons'

interface PageToolbarProps {
  searchValue?: string
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
  filters?: ReactNode
  actions?: ReactNode
  activeFilters?: Array<{
    key: string
    label: string
    onDelete?: () => void
  }>
  onClearFilters?: () => void
}

export default function PageToolbar({
  searchValue,
  searchPlaceholder = 'Search...',
  onSearchChange,
  filters,
  actions,
  activeFilters = [],
  onClearFilters,
}: PageToolbarProps) {
  const hasActiveFilters = activeFilters.length > 0

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        p: { xs: 1.25, sm: 1.5 },
        mb: 2.5,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.1 : 0.22)}`,
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.86 : 0.72),
        backdropFilter: 'saturate(180%) blur(14px)',
        boxShadow: `0 18px 50px -38px ${alpha(theme.palette.primary.main, 0.55)}`,
      })}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={1.25}
          sx={{ alignItems: { xs: 'stretch', lg: 'center' } }}
        >
          <TextField
            value={searchValue ?? ''}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={searchPlaceholder}
            size="small"
            sx={{
              minWidth: { xs: '100%', lg: 320 },
              flex: { xs: 'initial', lg: 1 },
              '& .MuiInputBase-root': {
                bgcolor: 'background.paper',
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.disabled', fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          {filters && (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                flexWrap: 'wrap',
                rowGap: 1,
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', lg: 'center' },
              }}
            >
              {filters}
            </Stack>
          )}

          {actions && (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                ml: { lg: 'auto' },
                justifyContent: { xs: 'stretch', sm: 'flex-end' },
                '& > *': {
                  flex: { xs: 1, sm: 'initial' },
                },
              }}
            >
              {actions}
            </Stack>
          )}
        </Stack>

        {hasActiveFilters && (
          <Box>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, alignItems: 'center' }}>
              {activeFilters.map((filter) => (
                <Chip
                  key={filter.key}
                  label={filter.label}
                  onDelete={filter.onDelete}
                  size="small"
                  sx={(theme) => ({
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                    fontWeight: 700,
                    '& .MuiChip-deleteIcon': {
                      color: 'primary.main',
                    },
                  })}
                />
              ))}
              {onClearFilters && (
                <Button size="small" color="inherit" onClick={onClearFilters} sx={{ fontWeight: 700 }}>
                  Clear filters
                </Button>
              )}
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  )
}
