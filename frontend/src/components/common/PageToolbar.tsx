import { ReactNode, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Chip,
  Collapse,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  alpha,
} from '@mui/material'
import { Search, TuneOutlined, ExpandLess, ExpandMore } from '@/components/ui/icons'
import { getListSurfaceSx } from './surfaceStyles'

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
  clearFiltersLabel?: string
  defaultFiltersOpen?: boolean
  filterButtonLabel?: string
}

const toolbarControlSx = {
  '& .MuiInputBase-root, & .MuiButton-root': {
    minHeight: 'var(--app-control-height)',
    height: 'var(--app-control-height)',
  },
  '& .MuiInputBase-input': {
    height: 'var(--app-control-height)',
    lineHeight: 'var(--app-control-height)',
    boxSizing: 'border-box',
  },
}

export default function PageToolbar({
  searchValue,
  searchPlaceholder = 'Search...',
  onSearchChange,
  filters,
  actions,
  activeFilters = [],
  onClearFilters,
  clearFiltersLabel = 'Clear filters',
  defaultFiltersOpen = false,
  filterButtonLabel = 'Filters',
}: PageToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(defaultFiltersOpen)
  const hasFilters = Boolean(filters)
  const hasActiveFilters = activeFilters.length > 0

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        ...getListSurfaceSx(theme),
        p: { xs: 1.25, sm: 1.5 },
        mb: 2.5,
        ...toolbarControlSx,
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

          <Stack
            direction="row"
            spacing={1}
            sx={{
              ml: { lg: 'auto' },
              alignItems: 'center',
              justifyContent: { xs: 'stretch', sm: 'flex-end' },
              '& > *': {
                flex: { xs: 1, sm: 'initial' },
              },
              '& .MuiBadge-root': {
                display: 'flex',
                minHeight: 'var(--app-control-height)',
              },
              '& .MuiBadge-root > .MuiButton-root': {
                width: { xs: '100%', sm: 'auto' },
              },
            }}
          >
            {hasFilters && (
              <Badge
                color="primary"
                badgeContent={activeFilters.length}
                invisible={!hasActiveFilters}
                sx={{
                  '& .MuiBadge-badge': {
                    fontWeight: 800,
                  },
                }}
              >
                <Button
                  variant={filtersOpen || hasActiveFilters ? 'contained' : 'outlined'}
                  color="primary"
                  startIcon={<TuneOutlined />}
                  endIcon={filtersOpen ? <ExpandLess /> : <ExpandMore />}
                  onClick={() => setFiltersOpen((open) => !open)}
                  sx={{ fontWeight: 800 }}
                >
                  {filterButtonLabel}
                </Button>
              </Badge>
            )}

            {actions}
          </Stack>
        </Stack>

        {hasFilters && (
          <Collapse
            in={filtersOpen}
            timeout={260}
            easing={{
              enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
              exit: 'cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Box
              sx={(theme) => ({
                pt: 1.25,
                mt: -0.25,
                borderTop: `1px solid ${theme.palette.divider}`,
                opacity: filtersOpen ? 1 : 0,
                transform: filtersOpen ? 'translateY(0)' : 'translateY(-4px)',
                transition: theme.transitions.create(['opacity', 'transform'], {
                  duration: 220,
                  easing: theme.transitions.easing.easeInOut,
                }),
              })}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{
                  flexWrap: { xs: 'nowrap', sm: 'wrap' },
                  rowGap: 1,
                  alignItems: { xs: 'stretch', sm: 'center' },
                  justifyContent: { xs: 'flex-start', sm: 'flex-start' },
                  pb: 0.25,
                  '& > *': {
                    width: { xs: '100%', sm: 'auto' },
                    maxWidth: '100%',
                    flex: { xs: '0 0 auto', sm: 'initial' },
                    alignSelf: { xs: 'stretch', sm: 'center' },
                  },
                  '& .MuiTextField-root, & .MuiFormControl-root': {
                    minWidth: { xs: '100%', sm: 180 },
                    width: { xs: '100%', sm: 'auto' },
                  },
                }}
              >
                {filters}
              </Stack>
            </Box>
          </Collapse>
        )}

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
                  {clearFiltersLabel}
                </Button>
              )}
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  )
}
