'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  Box,
  Button,
  Drawer,
  Slider,
  Stack,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import {
  DarkModeOutlined,
  LanguageOutlined,
  LightModeOutlined,
  HistoryOutlined,
  MonitorOutlined,
  PaletteOutlined,
  StraightenOutlined,
  TextFieldsOutlined,
  TuneOutlined,
  ViewSidebarOutlined,
} from '@/components/ui/icons'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/stores/uiStore'
import {
  BORDER_RADIUS_MAX,
  BORDER_RADIUS_MIN,
  BORDER_RADIUS_STEP,
  ENGLISH_FONT_OPTIONS,
  LAYOUT_SURFACE_THEME_OPTIONS,
  LAYOUT_SIZE_OPTIONS,
  THEME_COLOR_PRESETS,
  type LayoutSurfaceTheme,
} from '@/theme'

const settingsButtonSx = {
  minHeight: 'var(--app-control-height)',
  height: 'var(--app-control-height)',
  px: 1.5,
  gap: 1,
  minWidth: 0,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
} as const

const settingsToggleButtonSx = {
  minHeight: 'var(--app-control-height)',
  height: 'var(--app-control-height)',
  px: 1.5,
  gap: 0.75,
  minWidth: 0,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
  justifyContent: 'center',
} as const

const settingsSegmentGroupSx = {
  display: 'grid',
  gap: 1,
  '& .MuiToggleButtonGroup-grouped': {
    width: '100%',
    m: 0,
    border: 1,
    borderColor: 'divider',
    borderRadius: 1,
    '&:not(:first-of-type)': {
      borderLeft: 1,
      borderColor: 'divider',
    },
    '&.Mui-selected': {
      borderColor: 'primary.main',
    },
    '&.Mui-selected:hover': {
      borderColor: 'primary.main',
    },
  },
} as const

function SwatchButton({
  color,
  selected,
  label,
  ariaLabel,
  onClick,
}: {
  color: string
  selected: boolean
  label: string
  ariaLabel: string
  onClick: () => void
}) {
  const theme = useTheme()

  return (
    <Tooltip title={label}>
      <Button
        variant="outlined"
        onClick={onClick}
        aria-label={ariaLabel}
        sx={{
          width: 'var(--app-control-height)',
          height: 'var(--app-control-height)',
          minWidth: 'var(--app-control-height)',
          minHeight: 'var(--app-control-height)',
          p: 0.5,
          borderRadius: '50%',
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? color : theme.palette.divider,
          bgcolor: alpha(theme.palette.background.paper, 0.42),
          boxShadow: selected ? `0 0 0 3px ${alpha(color, 0.18)}` : 'none',
          '&:hover': {
            borderWidth: 2,
            borderColor: color,
            bgcolor: alpha(theme.palette.background.paper, 0.64),
            boxShadow: `0 0 0 3px ${alpha(color, 0.14)}`,
          },
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            bgcolor: color,
            boxShadow: `inset 0 0 0 1px ${alpha('#000000', 0.08)}`,
          }}
        />
      </Button>
    </Tooltip>
  )
}

function SectionTitle({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
      <Box
        sx={(theme) => ({
          width: 28,
          height: 28,
          borderRadius: `${theme.shape.borderRadius}px`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'primary.main',
          bgcolor: alpha(theme.palette.primary.main, 0.08),
        })}
      >
        {icon}
      </Box>
      <Typography variant="subtitle2">{label}</Typography>
    </Stack>
  )
}

function SurfaceThemePicker({
  value,
  onChange,
  ariaLabel,
}: {
  value: LayoutSurfaceTheme
  onChange: (value: LayoutSurfaceTheme) => void
  ariaLabel: string
}) {
  const { t } = useTranslation('common')

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      {LAYOUT_SURFACE_THEME_OPTIONS.map((option) => {
        const selected = value === option.value
        const label = t(option.labelKey)

        return (
          <SwatchButton
            key={option.value}
            color={option.main}
            selected={selected}
            label={label}
            ariaLabel={`${ariaLabel}: ${label}`}
              onClick={() => onChange(option.value)}
          />
        )
      })}
    </Box>
  )
}

export default function LayoutSettings() {
  const { t } = useTranslation('common')
  const theme = useTheme()
  const settingsOpen = useUIStore((state) => state.settingsOpen)
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen)
  const themeMode = useUIStore((state) => state.themeMode)
  const setTheme = useUIStore((state) => state.setTheme)
  const language = useUIStore((state) => state.language)
  const setLanguage = useUIStore((state) => state.setLanguage)
  const fontPreset = useUIStore((state) => state.fontPreset)
  const setFontPreset = useUIStore((state) => state.setFontPreset)
  const colorPreset = useUIStore((state) => state.colorPreset)
  const setColorPreset = useUIStore((state) => state.setColorPreset)
  const layoutSize = useUIStore((state) => state.layoutSize)
  const setLayoutSize = useUIStore((state) => state.setLayoutSize)
  const borderRadiusLevel = useUIStore((state) => state.borderRadiusLevel)
  const setBorderRadiusLevel = useUIStore((state) => state.setBorderRadiusLevel)
  const sidebarTheme = useUIStore((state) => state.sidebarTheme)
  const setSidebarTheme = useUIStore((state) => state.setSidebarTheme)
  const topbarTheme = useUIStore((state) => state.topbarTheme)
  const setTopbarTheme = useUIStore((state) => state.setTopbarTheme)
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)
  const contentStretch = useUIStore((state) => state.contentStretch)
  const setContentStretch = useUIStore((state) => state.setContentStretch)
  const resetLayoutSettings = useUIStore((state) => state.resetLayoutSettings)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  return (
    <Drawer
      anchor="right"
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      ModalProps={{
        keepMounted: true,
        disableScrollLock: true,
      }}
      transitionDuration={{
        enter: theme.transitions.duration.shorter,
        exit: theme.transitions.duration.shortest,
      }}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 1,
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.4 : 0.2),
          },
        },
        paper: {
          sx: {
            width: { xs: '100%', sm: 380 },
            maxWidth: '100vw',
            height: '100dvh',
            backgroundColor: alpha(
              theme.palette.mode === 'dark' ? '#1C252E' : '#F4F6F8',
              theme.palette.mode === 'dark' ? 0.92 : 0.88
            ),
            backgroundImage: 'none',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `-24px 0 48px -20px ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.48 : 0.24)}`,
            zIndex: (theme) => theme.zIndex.modal + 1,
          },
        },
      }}
    >
      <Stack sx={{ height: '100%', overflow: 'hidden' }}>
        <Stack spacing={2.5} sx={{ p: 2.5, overflowY: 'auto', overflowX: 'hidden', flex: '1 1 auto' }}>
          {/* Theme Mode + Language row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.grey[500], 0.12),
              }}
            >
              <SectionTitle
                icon={<LightModeOutlined fontSize="small" />}
                label={t('layoutSettings.themeMode')}
              />
              <ToggleButtonGroup
                exclusive
                fullWidth
                value={themeMode}
                onChange={(_, value) => value && setTheme(value)}
                sx={{ ...settingsSegmentGroupSx, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
              >
                <ToggleButton value="light" sx={settingsToggleButtonSx}>
                  <LightModeOutlined fontSize="small" />
                </ToggleButton>
                <ToggleButton value="dark" sx={settingsToggleButtonSx}>
                  <DarkModeOutlined fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.grey[500], 0.12),
              }}
            >
              <SectionTitle
                icon={<LanguageOutlined fontSize="small" />}
                label={t('layoutSettings.language')}
              />
              <ToggleButtonGroup
                exclusive
                fullWidth
                value={language}
                onChange={(_, value) => value && setLanguage(value)}
                sx={{ ...settingsSegmentGroupSx, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
              >
                <ToggleButton value="en" sx={settingsToggleButtonSx}>EN</ToggleButton>
                <ToggleButton value="km" sx={settingsToggleButtonSx}>KH</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {/* Theme Colors */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.grey[500], 0.12),
            }}
          >
            <SectionTitle
              icon={<PaletteOutlined fontSize="small" />}
              label={t('layoutSettings.themeColor')}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {THEME_COLOR_PRESETS.map((preset) => {
                const selected = colorPreset === preset.value
                const presetLabel = t(preset.labelKey)
                return (
                  <SwatchButton
                    key={preset.value}
                    color={preset.main}
                    selected={selected}
                    label={presetLabel}
                    ariaLabel={t('layoutSettings.useColorPreset', { name: presetLabel })}
                    onClick={() => setColorPreset(preset.value)}
                  />
                )
              })}
            </Box>
          </Box>

          {/* Font + Size row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.grey[500], 0.12),
              }}
            >
              <SectionTitle
                icon={<TextFieldsOutlined fontSize="small" />}
                label={t('layoutSettings.fontFamily')}
              />
              <Stack spacing={0.75}>
                {ENGLISH_FONT_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    fullWidth
                    variant={fontPreset === option.value ? 'contained' : 'outlined'}
                    onClick={() => setFontPreset(option.value)}
                    startIcon={<TextFieldsOutlined />}
                    sx={{
                      ...settingsButtonSx,
                      justifyContent: 'flex-start',
                      fontFamily: `"${option.family}", "Kantumruy Pro", sans-serif`,
                      fontSize: '0.8rem',
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Stack>
            </Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.grey[500], 0.12),
              }}
            >
              <SectionTitle
                icon={<StraightenOutlined fontSize="small" />}
                label={t('layoutSettings.size')}
              />
              <ToggleButtonGroup
                exclusive
                fullWidth
                value={layoutSize}
                onChange={(_, value) => value && setLayoutSize(value)}
                sx={{ ...settingsSegmentGroupSx, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
              >
                {LAYOUT_SIZE_OPTIONS.map((option) => (
                  <ToggleButton key={option.value} value={option.value} sx={{ ...settingsToggleButtonSx, fontSize: '0.75rem' }}>
                    {t(option.labelKey)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          </Box>

          {/* Corner Radius */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.grey[500], 0.12),
            }}
          >
            <SectionTitle
              icon={<TuneOutlined fontSize="small" />}
              label={t('layoutSettings.cornerRadius')}
            />
            <Stack spacing={1.25} sx={{ px: 0.5 }}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {borderRadiusLevel === 0
                    ? t('layoutSettings.radiusNone')
                    : t('layoutSettings.radiusValue', { value: borderRadiusLevel })}
                </Typography>
                <Box
                  sx={{
                    width: 28,
                    height: 20,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: `${borderRadiusLevel}px`,
                    bgcolor: 'background.paper',
                  }}
                />
              </Stack>
              <Slider
                value={borderRadiusLevel}
                onChange={(_, value) => setBorderRadiusLevel(Array.isArray(value) ? value[0] : value)}
                min={BORDER_RADIUS_MIN}
                max={BORDER_RADIUS_MAX}
                step={BORDER_RADIUS_STEP}
                size="small"
                valueLabelDisplay="auto"
                aria-label={t('layoutSettings.cornerRadius')}
              />
            </Stack>
          </Box>

          {/* Navigation */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.grey[500], 0.12),
            }}
          >
            <SectionTitle
              icon={<ViewSidebarOutlined fontSize="small" />}
              label={t('layoutSettings.navigation')}
            />
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant={sidebarOpen ? 'contained' : 'outlined'}
                onClick={() => setSidebarOpen(true)}
                startIcon={<ViewSidebarOutlined />}
                sx={settingsButtonSx}
              >
                {t('layoutSettings.full')}
              </Button>
              <Button
                fullWidth
                variant={!sidebarOpen ? 'contained' : 'outlined'}
                onClick={() => setSidebarOpen(false)}
                startIcon={<ViewSidebarOutlined />}
                sx={settingsButtonSx}
              >
                {t('layoutSettings.mini')}
              </Button>
            </Stack>
          </Box>

          {/* Sidebar + Topbar themes row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.grey[500], 0.12),
              }}
            >
              <SectionTitle
                icon={<ViewSidebarOutlined fontSize="small" />}
                label={t('layoutSettings.sidebarTheme')}
              />
              <SurfaceThemePicker
                value={sidebarTheme}
                onChange={setSidebarTheme}
                ariaLabel={t('layoutSettings.sidebarTheme')}
              />
            </Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.grey[500], 0.12),
              }}
            >
              <SectionTitle
                icon={<MonitorOutlined fontSize="small" />}
                label={t('layoutSettings.topbarTheme')}
              />
              <SurfaceThemePicker
                value={topbarTheme}
                onChange={setTopbarTheme}
                ariaLabel={t('layoutSettings.topbarTheme')}
              />
            </Box>
          </Box>

          {/* Content */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.grey[500], 0.12),
            }}
          >
            <SectionTitle
              icon={<TuneOutlined fontSize="small" />}
              label={t('layoutSettings.content')}
            />
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
              <Box
                component="button"
                type="button"
                onClick={() => setContentStretch(!contentStretch)}
                title={contentStretch ? t('layoutSettings.standard') : t('layoutSettings.stretch')}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: alpha(theme.palette.divider, 0.2),
                  bgcolor: alpha(theme.palette.grey[500], 0.12),
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: alpha(theme.palette.grey[500], 0.14) },
                }}
              >
                {contentStretch ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="5" width="18" height="14" rx="1" />
                    <path d="M3 10h18" /><path d="M3 14h18" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M2 6h20" /><path d="M2 10h20" /><path d="M2 14h20" /><path d="M2 18h20" />
                  </svg>
                )}
              </Box>
              <Box
                component="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? t('layoutSettings.exitFullscreen') : t('layoutSettings.fullscreen')}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: alpha(theme.palette.divider, 0.2),
                  bgcolor: isFullscreen
                    ? alpha(theme.palette.primary.main, 0.12)
                    : alpha(theme.palette.grey[500], 0.12),
                  color: isFullscreen ? 'primary.main' : 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isFullscreen
                      ? alpha(theme.palette.primary.main, 0.2)
                      : alpha(theme.palette.grey[500], 0.14),
                  },
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  {isFullscreen ? (
                    <>
                      <path d="M8 3v3a2 2 0 01-2 2H3" />
                      <path d="M21 8h-3a2 2 0 01-2-2V3" />
                      <path d="M16 21v-3a2 2 0 012-2h3" />
                      <path d="M3 16h3a2 2 0 012 2v3" />
                    </>
                  ) : (
                    <>
                      <path d="M8 3H5a2 2 0 00-2 2v3" />
                      <path d="M21 8V5a2 2 0 00-2-2h-3" />
                      <path d="M16 21h3a2 2 0 002-2v-3" />
                      <path d="M3 16v3a2 2 0 002 2h3" />
                    </>
                  )}
                </svg>
              </Box>
              <Box
                component="button"
                type="button"
                onClick={resetLayoutSettings}
                title={t('layoutSettings.resetToDefault')}
                sx={(theme) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: alpha(theme.palette.divider, 0.2),
                  bgcolor: alpha(theme.palette.grey[500], 0.12),
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: 'calc(var(--app-control-height) * 0.45)',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                    color: 'error.main',
                    borderColor: alpha(theme.palette.error.main, 0.2),
                  },
                })}
              >
                <HistoryOutlined fontSize="inherit" />
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Drawer>
  )
}
