'use client'

import type { ReactNode } from 'react'
import {
  Box,
  Button,
  Divider,
  Drawer,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import {
  Close,
  DarkModeOutlined,
  LanguageOutlined,
  LightModeOutlined,
  HistoryOutlined,
  MonitorOutlined,
  PaletteOutlined,
  SettingsOutlined,
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
            bgcolor: alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.32 : 0.14),
          },
        },
        paper: {
          sx: {
            width: { xs: '100%', sm: 360 },
            maxWidth: '100vw',
            height: '100dvh',
            backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.96 : 0.98),
            backgroundImage: 'none',
            borderLeft: `1px solid ${alpha(theme.palette.grey[500], theme.palette.mode === 'dark' ? 0.24 : 0.16)}`,
            boxShadow: `-24px 0 48px -20px ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.48 : 0.24)}`,
            zIndex: (theme) => theme.zIndex.modal + 1,
          },
        },
      }}
    >
      <Stack sx={{ height: '100%' }}>
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            flexShrink: 0,
            backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.86 : 0.92),
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box
              sx={(theme) => ({
                width: 36,
                height: 36,
                borderRadius: `${theme.shape.borderRadius}px`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              })}
            >
              <SettingsOutlined />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1">{t('layoutSettings.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('layoutSettings.subtitle')}
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="text"
            color="inherit"
            onClick={() => setSettingsOpen(false)}
            sx={{
              minWidth: 'var(--app-control-height)',
              width: 'var(--app-control-height)',
              height: 'var(--app-control-height)',
              p: 0,
            }}
          >
            <Close fontSize="small" />
          </Button>
        </Stack>

        <Divider sx={{ flexShrink: 0, borderColor: alpha(theme.palette.grey[500], 0.16) }} />

        <Stack spacing={2.5} sx={{ p: 2, overflowY: 'auto', overflowX: 'hidden', flex: '1 1 auto' }}>
          <Box>
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
                <Box component="span">
                  {t('layoutSettings.light')}
                </Box>
              </ToggleButton>
              <ToggleButton value="dark" sx={settingsToggleButtonSx}>
                <DarkModeOutlined fontSize="small" />
                <Box component="span">
                  {t('layoutSettings.dark')}
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box>
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
              <ToggleButton value="en" sx={settingsToggleButtonSx}>English</ToggleButton>
              <ToggleButton value="km" sx={settingsToggleButtonSx}>ខ្មែរ</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box>
            <SectionTitle
              icon={<PaletteOutlined fontSize="small" />}
              label={t('layoutSettings.themeColor')}
            />
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
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

          <Box>
            <SectionTitle
              icon={<TextFieldsOutlined fontSize="small" />}
              label={t('layoutSettings.fontFamily')}
            />
            <Stack spacing={1}>
              {ENGLISH_FONT_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  fullWidth
                  variant={fontPreset === option.value ? 'contained' : 'outlined'}
                  onClick={() => setFontPreset(option.value)}
                  sx={{
                    ...settingsButtonSx,
                    justifyContent: 'flex-start',
                    fontFamily: `"${option.family}", "Kantumruy Pro", sans-serif`,
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </Stack>
          </Box>

          <Box>
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
                <ToggleButton key={option.value} value={option.value} sx={settingsToggleButtonSx}>
                  {t(option.labelKey)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Box>
            <SectionTitle
              icon={<TuneOutlined fontSize="small" />}
              label={t('layoutSettings.cornerRadius')}
            />
            <Stack
              spacing={1.25}
              sx={{
                px: 1.5,
                py: 1.25,
                borderRadius: `${theme.shape.borderRadius}px`,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.grey[500], 0.04),
              }}
            >
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {borderRadiusLevel === 0
                    ? t('layoutSettings.radiusNone')
                    : t('layoutSettings.radiusValue', { value: borderRadiusLevel })}
                </Typography>
                <Box
                  sx={{
                    width: 34,
                    height: 24,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: `${borderRadiusLevel}px`,
                    bgcolor: 'background.paper',
                    boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.08)}`,
                  }}
                />
              </Stack>
              <Slider
                value={borderRadiusLevel}
                onChange={(_, value) => setBorderRadiusLevel(Array.isArray(value) ? value[0] : value)}
                min={BORDER_RADIUS_MIN}
                max={BORDER_RADIUS_MAX}
                step={BORDER_RADIUS_STEP}
                marks={[
                  { value: BORDER_RADIUS_MIN, label: '0' },
                  { value: 8, label: '8' },
                  { value: BORDER_RADIUS_MAX, label: String(BORDER_RADIUS_MAX) },
                ]}
                valueLabelDisplay="auto"
                aria-label={t('layoutSettings.cornerRadius')}
              />
            </Stack>
          </Box>

          <Box>
            <SectionTitle
              icon={<ViewSidebarOutlined fontSize="small" />}
              label={t('layoutSettings.navigation')}
            />
            <Stack
              direction="row"
              spacing={1}
              sx={{
                p: 1,
                borderRadius: `${theme.shape.borderRadius}px`,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.grey[500], 0.04),
              }}
            >
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

          <Box>
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

          <Box>
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

          <Box>
            <SectionTitle
              icon={<TuneOutlined fontSize="small" />}
              label={t('layoutSettings.content')}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={contentStretch}
                  onChange={(event) => setContentStretch(event.target.checked)}
                />
              }
              label={t('layoutSettings.stretchContent')}
            />
          </Box>
        </Stack>

        <Divider sx={{ flexShrink: 0, borderColor: alpha(theme.palette.grey[500], 0.16) }} />

        <Box
          sx={{
            flexShrink: 0,
            p: 2,
            backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.86 : 0.92),
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            startIcon={<HistoryOutlined />}
            onClick={resetLayoutSettings}
            sx={settingsButtonSx}
          >
            {t('layoutSettings.resetToDefault')}
          </Button>
        </Box>
      </Stack>
    </Drawer>
  )
}
