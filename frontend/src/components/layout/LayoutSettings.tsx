'use client'

import type { ReactNode } from 'react'
import {
  Box,
  Button,
  Divider,
  Drawer,
  FormControlLabel,
  Stack,
  Switch,
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
import { ENGLISH_FONT_OPTIONS, LAYOUT_SIZE_OPTIONS, THEME_COLOR_PRESETS } from '@/theme'

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
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 360 },
            bgcolor: 'background.paper',
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
            px: 2.5,
            py: 2,
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 1.25,
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
            sx={{ minWidth: 40, width: 40, height: 40, p: 0 }}
          >
            <Close fontSize="small" />
          </Button>
        </Stack>

        <Divider />

        <Stack spacing={3} sx={{ p: 2.5 }}>
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
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 1,
              }}
            >
              {THEME_COLOR_PRESETS.map((preset) => {
                const selected = colorPreset === preset.value

                return (
                  <Button
                    key={preset.value}
                    variant="outlined"
                    onClick={() => setColorPreset(preset.value)}
                    sx={{
                      minHeight: 58,
                      p: 1,
                      justifyContent: 'center',
                      borderColor: selected ? preset.main : theme.palette.divider,
                      bgcolor: selected ? alpha(preset.main, 0.08) : 'transparent',
                      '&:hover': {
                        borderColor: preset.main,
                        bgcolor: alpha(preset.main, 0.12),
                      },
                    }}
                    aria-label={t('layoutSettings.useColorPreset', { name: preset.label })}
                  >
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        bgcolor: preset.main,
                        boxShadow: selected
                          ? `0 0 0 4px ${alpha(preset.main, 0.16)}`
                          : `inset 0 0 0 1px ${alpha('#000000', 0.08)}`,
                      }}
                    />
                  </Button>
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
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={sidebarTheme}
              onChange={(_, value) => value && setSidebarTheme(value)}
              size="small"
            >
              <ToggleButton value="inherit">{t('layoutSettings.inherit')}</ToggleButton>
              <ToggleButton value="light">{t('layoutSettings.light')}</ToggleButton>
              <ToggleButton value="dark">{t('layoutSettings.dark')}</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box>
            <SectionTitle
              icon={<MonitorOutlined fontSize="small" />}
              label={t('layoutSettings.topbarTheme')}
            />
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={topbarTheme}
              onChange={(_, value) => value && setTopbarTheme(value)}
              size="small"
            >
              <ToggleButton value="inherit">{t('layoutSettings.inherit')}</ToggleButton>
              <ToggleButton value="light">{t('layoutSettings.light')}</ToggleButton>
              <ToggleButton value="dark">{t('layoutSettings.dark')}</ToggleButton>
            </ToggleButtonGroup>
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
