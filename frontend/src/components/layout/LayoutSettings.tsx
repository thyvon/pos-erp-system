'use client'

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
import { Close, DarkModeOutlined, LightModeOutlined, ViewSidebarOutlined } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/stores/uiStore'
import { ENGLISH_FONT_OPTIONS, THEME_COLOR_PRESETS } from '@/theme'

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
          <Box>
            <Typography variant="subtitle1">{t('layoutSettings.title')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('layoutSettings.subtitle')}
            </Typography>
          </Box>
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
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              {t('layoutSettings.themeMode')}
            </Typography>
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
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              {t('layoutSettings.language')}
            </Typography>
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
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              {t('layoutSettings.themeColor')}
            </Typography>
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
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('layoutSettings.fontFamily')}
            </Typography>
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
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              {t('layoutSettings.navigation')}
            </Typography>
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
              >
                {t('layoutSettings.mini')}
              </Button>
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('layoutSettings.content')}
            </Typography>
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
