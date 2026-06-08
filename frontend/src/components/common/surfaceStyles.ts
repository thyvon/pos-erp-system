import { alpha, type Theme } from '@mui/material/styles'

export function getListSurfaceSx(theme: Theme) {
  return {
    borderRadius: `${theme.shape.borderRadius}px`,
    border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.1 : 0.22)}`,
    bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.9 : 0.76),
    backdropFilter: 'saturate(180%) blur(12px)',
    boxShadow: `0 18px 50px -40px ${alpha(theme.palette.primary.main, 0.55)}`,
  }
}

export function getCardSurfaceSx(theme: Theme) {
  return {
    borderRadius: `${theme.shape.borderRadius}px`,
    border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.1 : 0.22)}`,
    bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.92 : 0.78),
    backdropFilter: 'saturate(180%) blur(10px)',
    boxShadow: `0 16px 42px -36px ${alpha(theme.palette.primary.main, 0.5)}`,
  }
}
