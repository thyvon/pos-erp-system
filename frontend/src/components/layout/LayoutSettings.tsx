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

function SectionTitle({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'primary.main',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
        }}
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
  const theme = useTheme()

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
          <Tooltip key={option.value} title={label}>
            <Button
              variant="outlined"
              onClick={() => onChange(option.value)}
              aria-label={`${ariaLabel}: ${label}`}
              sx={{
                width: 34,
                height: 34,
                minWidth: 34,
                minHeight: 34,
                p: 0,
                borderRadius: '50%',
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? option.main : theme.palette.divider,
                bgcolor: option.main,
                boxShadow: selected ? `0 0 0 3px ${alpha(option.main, 0.18)}` : `inset 0 0 0 1px ${alpha('#000000', 0.08)}`,
                '&:hover': {
                  borderWidth: 2,
                  borderColor: option.main,
                  boxShadow: `0 0 0 3px ${alpha(option.main, 0.14)}`,
                },
              }}
            />
          </Tooltip>
        )
      })}
    </Box>
  )
}

export default function LayoutSettings() {
  const { t } = useTranslation('common')
  const theme = useTheme()
  const {
    settingsOpen,
    setSettingsOpen,
    themeMode,
    setTheme,
    language,
    setLanguage,
    fontPreset,
    setFontPreset,
    colorPreset,
    setColorPreset,
    layoutSize,
    setLayoutSize,
    borderRadiusLevel,
    setBorderRadiusLevel,
    sidebarTheme,
    setSidebarTheme,
    topbarTheme,
    setTopbarTheme,
    sidebarOpen,
    setSidebarOpen,
    contentStretch,
    setContentStretch,
  } = useUIStore()

  return (
    <Drawer
      anchor="right"
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 1,
      }}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 360 },
            maxWidth: '100vw',
            height: '100dvh',
            bgcolor: 'background.paper',
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
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }}
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

        <Divider sx={{ flexShrink: 0 }} />

        <Stack spacing={2.5} sx={{ p: 2, overflowY: 'auto', overflowX: 'hidden' }}>
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
              size="small"
            >
              <ToggleButton value="light">
                <LightModeOutlined fontSize="small" />
                <Box component="span" sx={{ ml: 1 }}>
                  {t('layoutSettings.light')}
                </Box>
              </ToggleButton>
              <ToggleButton value="dark">
                <DarkModeOutlined fontSize="small" />
                <Box component="span" sx={{ ml: 1 }}>
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
              size="small"
            >
              <ToggleButton value="en">English</ToggleButton>
              <ToggleButton value="km">ខ្មែរ</ToggleButton>
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
                  <Tooltip key={preset.value} title={presetLabel}>
                    <Button
                      variant="outlined"
                      onClick={() => setColorPreset(preset.value)}
                      aria-label={t('layoutSettings.useColorPreset', { name: presetLabel })}
                      sx={{
                        width: 34,
                        height: 34,
                        minWidth: 34,
                        minHeight: 34,
                        p: 0,
                        borderRadius: '50%',
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? preset.main : theme.palette.divider,
                        bgcolor: preset.main,
                        boxShadow: selected
                          ? `0 0 0 3px ${alpha(preset.main, 0.18)}`
                          : `inset 0 0 0 1px ${alpha('#000000', 0.08)}`,
                        '&:hover': {
                          borderWidth: 2,
                          borderColor: preset.main,
                          boxShadow: `0 0 0 3px ${alpha(preset.main, 0.14)}`,
                        },
                      }}
                    />
                  </Tooltip>
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
              size="small"
            >
              {LAYOUT_SIZE_OPTIONS.map((option) => (
                <ToggleButton key={option.value} value={option.value}>
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
                borderRadius: 1,
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
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.grey[500], 0.04),
              }}
            >
              <Button
                fullWidth
                variant={sidebarOpen ? 'contained' : 'outlined'}
                onClick={() => setSidebarOpen(true)}
                startIcon={<ViewSidebarOutlined />}
              >
                {t('layoutSettings.full')}
              </Button>
              <Button
                fullWidth
                variant={!sidebarOpen ? 'contained' : 'outlined'}
                onClick={() => setSidebarOpen(false)}
                startIcon={<ViewSidebarOutlined />}
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
      </Stack>
    </Drawer>
  )
}
