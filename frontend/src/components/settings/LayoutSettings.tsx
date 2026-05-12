'use client'

import {
  Box,
  Drawer,
  Typography,
  Divider,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Slider,
  Button,
  Stack,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material'
import {
  Close as CloseIcon,
  Settings as SettingsIcon,
  ViewSidebar as SidebarIcon,
  Dashboard as DashboardIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Computer as SystemIcon,
  Palette as PaletteIcon,
  TextFields as FontIcon,
  BorderStyle as BorderIcon,
} from '@mui/icons-material'
import { useSettingsStore, LayoutType, ThemeMode, ColorPreset, NavWidth } from '@/stores/settings'

interface LayoutSettingsProps {
  open: boolean
  onClose: () => void
}

export function LayoutSettings({ open, onClose }: LayoutSettingsProps) {
  const theme = useTheme()
  const {
    layoutType,
    navWidth,
    themeMode,
    colorPreset,
    fontFamily,
    fontSize,
    borderRadius,
    setLayoutType,
    setNavWidth,
    setThemeMode,
    setColorPreset,
    setFontFamily,
    setFontSize,
    setBorderRadius,
    resetSettings,
  } = useSettingsStore()

  const colorPresets = [
    { name: 'default', primary: '#00AB55', secondary: '#3366FF' },
    { name: 'blue', primary: '#1890FF', secondary: '#722ED1' },
    { name: 'purple', primary: '#722ED1', secondary: '#EB2F96' },
    { name: 'red', primary: '#FF4842', secondary: '#FFA940' },
    { name: 'green', primary: '#54D62C', secondary: '#00AB55' },
  ]

  const fontFamilies = [
    { name: 'Inter', value: '"Inter", "Kantumruy Pro", "Helvetica", "Arial", sans-serif' },
    { name: 'Roboto', value: '"Roboto", "Kantumruy Pro", "Helvetica", "Arial", sans-serif' },
    { name: 'Public Sans', value: '"Public Sans", "Kantumruy Pro", "Helvetica", "Arial", sans-serif' },
    { name: 'System UI', value: 'system-ui, "Kantumruy Pro", sans-serif' },
  ]

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 360,
          p: 0,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={600}>
            Settings
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
        {/* Layout */}
        <Box mb={4}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <SidebarIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Layout
            </Typography>
          </Stack>
          <Box sx={{ pl: 5.5 }}>
            <FormControl component="fieldset">
              <RadioGroup
                value={layoutType}
                onChange={(e) => setLayoutType(e.target.value as LayoutType)}
                sx={{ gap: 1 }}
              >
                <FormControlLabel
                  value="vertical"
                  control={<Radio size="small" />}
                  label="Vertical"
                />
                <FormControlLabel
                  value="mini"
                  control={<Radio size="small" />}
                  label="Mini"
                />
                <FormControlLabel
                  value="horizontal"
                  control={<Radio size="small" />}
                  label="Horizontal"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </Box>

        {/* Navigation Width */}
        {layoutType !== 'mini' && (
          <Box mb={4}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
              <DashboardIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Navigation Width
              </Typography>
            </Stack>
            <Box sx={{ pl: 5.5 }}>
            <FormControl component="fieldset">
              <RadioGroup
                value={navWidth}
                onChange={(e) => setNavWidth(e.target.value as NavWidth)}
              >
                <FormControlLabel
                  value="normal"
                  control={<Radio size="small" />}
                  label="Normal (280px)"
                />
                <FormControlLabel
                  value="compact"
                  control={<Radio size="small" />}
                  label="Compact (200px)"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Theme */}
        <Box mb={4}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <PaletteIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Theme
            </Typography>
          </Stack>
          <Box sx={{ pl: 5.5 }}>
          <FormControl component="fieldset">
            <RadioGroup
              value={themeMode}
              onChange={(e) => setThemeMode(e.target.value as ThemeMode)}
            >
              <FormControlLabel
                value="light"
                control={<Radio size="small" />}
                label="Light"
              />
              <FormControlLabel
                value="dark"
                control={<Radio size="small" />}
                label="Dark"
              />
              <FormControlLabel
                value="system"
                control={<Radio size="small" />}
                label="System"
              />
            </RadioGroup>
          </FormControl>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Color Presets */}
        <Box mb={4}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <PaletteIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Color Presets
            </Typography>
          </Stack>
          <Box sx={{ pl: 5.5 }}>
          <Stack spacing={1}>
            {colorPresets.map((preset) => (
              <Box
                key={preset.name}
                onClick={() => setColorPreset(preset.name as ColorPreset)}
                sx={{
                  p: 2,
                  borderRadius: 1,
                  border: colorPreset === preset.name ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                  borderColor: colorPreset === preset.name ? 'primary.main' : 'divider',
                  cursor: 'pointer',
                  backgroundColor: colorPreset === preset.name ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: alpha(theme.palette.action.hover, 0.04),
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: `linear-gradient(45deg, ${preset.primary} 50%, ${preset.secondary} 50%)`,
                    }}
                  />
                  <Typography variant="body2" textTransform="capitalize">
                    {preset.name}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Font Family */}
        <Box mb={4}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <FontIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Font Family
            </Typography>
          </Stack>
          <Box sx={{ pl: 5.5 }}>
          <FormControl component="fieldset">
            <RadioGroup
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
            >
              {fontFamilies.map((font) => (
                <FormControlLabel
                  key={font.name}
                  value={font.value}
                  control={<Radio size="small" />}
                  label={font.name}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Font Size */}
        <Box mb={4}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <FontIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Font Size
            </Typography>
          </Stack>
          <Box sx={{ pl: 5.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="body2" color="text.secondary">
                {fontSize}px
              </Typography>
            </Stack>
          <Slider
            value={fontSize}
            onChange={(_, value) => setFontSize(value as number)}
            min={12}
            max={18}
            step={1}
            marks={[
              { value: 12, label: '12px' },
              { value: 14, label: '14px' },
              { value: 16, label: '16px' },
              { value: 18, label: '18px' },
            ]}
            valueLabelDisplay="auto"
            sx={{ mb: 2 }}
          />
        </Box>

        {/* Border Radius */}
        <Box mb={4}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <BorderIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Border Radius
            </Typography>
          </Stack>
          <Box sx={{ pl: 5.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="body2" color="text.secondary">
                {borderRadius}px
              </Typography>
            </Stack>
          <Slider
            value={borderRadius}
            onChange={(_, value) => setBorderRadius(value as number)}
            min={0}
            max={16}
            step={1}
            marks={[
              { value: 0, label: '0px' },
              { value: 4, label: '4px' },
              { value: 8, label: '8px' },
              { value: 12, label: '12px' },
              { value: 16, label: '16px' },
            ]}
            valueLabelDisplay="auto"
            sx={{ mb: 2 }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Reset Button */}
        <Button
          variant="outlined"
          fullWidth
          onClick={resetSettings}
          startIcon={<SettingsIcon />}
        >
          Reset to Default
        </Button>
      </Box>
    </Drawer>
  )
}
