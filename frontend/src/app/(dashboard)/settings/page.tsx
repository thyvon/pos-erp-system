'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { SaveOutlined, SettingsOutlined } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { SETTINGS_GROUPS } from '@/features/settings/definitions'
import { useSettingsGroupQuery, useUpdateSettingsGroupMutation } from '@/features/settings/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { SettingValue, SettingsFieldDefinition, SettingsGroupKey, SettingsGroupValues } from '@/types/settings'

function normalizeValue(value: SettingValue | undefined, field: SettingsFieldDefinition) {
  if (field.type === 'boolean') return Boolean(value)
  if (field.type === 'number') return value === null || value === undefined ? '' : String(value)
  return value === null || value === undefined ? '' : String(value)
}

function valueForSubmit(value: unknown, field: SettingsFieldDefinition): SettingValue {
  if (field.type === 'boolean') return Boolean(value)
  if (field.type === 'number') {
    if (value === '') return null
    const numberValue = Number(value)
    return Number.isNaN(numberValue) ? null : numberValue
  }
  return String(value)
}

export default function SettingsPage() {
  const { t } = useTranslation(['settings', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const canEdit = can('settings.edit')
  const [activeGroup, setActiveGroup] = useState<SettingsGroupKey>('general')
  const activeDefinition = useMemo(
    () => SETTINGS_GROUPS.find((group) => group.key === activeGroup) ?? SETTINGS_GROUPS[0],
    [activeGroup]
  )
  const settingsQuery = useSettingsGroupQuery(activeGroup)
  const updateSettings = useUpdateSettingsGroupMutation(activeGroup)
  const [draftByGroup, setDraftByGroup] = useState<Partial<Record<SettingsGroupKey, Record<string, unknown>>>>({})
  const groupDraft = draftByGroup[activeGroup] ?? {}

  const getDraftValue = (field: SettingsFieldDefinition) => {
    if (Object.prototype.hasOwnProperty.call(groupDraft, field.key)) {
      return groupDraft[field.key]
    }

    return normalizeValue(settingsQuery.data?.[field.key], field)
  }

  const handleChange = (key: string, value: unknown) => {
    setDraftByGroup((prev) => ({
      ...prev,
      [activeGroup]: {
        ...(prev[activeGroup] ?? {}),
        [key]: value,
      },
    }))
  }

  const handleSubmit = async () => {
    const payload: SettingsGroupValues = {}
    activeDefinition.fields.forEach((field) => {
      payload[field.key] = valueForSubmit(getDraftValue(field), field)
    })

    try {
      await updateSettings.mutateAsync(payload)
      enqueueSnackbar(t('saved', { group: t(`groups.${activeGroup}`) }), { variant: 'success' })
    } catch (error) {
      const apiError = toAppApiError(error)
      enqueueSnackbar(apiError.message, { variant: 'error' })
    }
  }

  const renderField = (field: SettingsFieldDefinition) => {
    const label = t(`fields.${field.key}`)
    const value = getDraftValue(field)

    if (field.type === 'boolean') {
      return (
        <FormControlLabel
          key={field.key}
          control={
            <Switch
              checked={Boolean(value)}
              disabled={!canEdit || updateSettings.isPending}
              onChange={(event) => handleChange(field.key, event.target.checked)}
            />
          }
          label={label}
        />
      )
    }

    if (field.type === 'select') {
      return (
        <TextField
          key={field.key}
          select
          label={label}
          value={value ?? ''}
          disabled={!canEdit || updateSettings.isPending}
          onChange={(event) => handleChange(field.key, event.target.value)}
        >
          {field.options?.map((option) => (
            <MenuItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )
    }

    return (
      <TextField
        key={field.key}
        label={label}
        type={field.type === 'number' ? 'number' : 'text'}
        value={value ?? ''}
        multiline={field.type === 'textarea'}
        minRows={field.type === 'textarea' ? 3 : undefined}
        disabled={!canEdit || updateSettings.isPending}
        onChange={(event) => handleChange(field.key, event.target.value)}
      />
    )
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <SettingsOutlined color="primary" />
            <Typography variant="h4">{t('title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('subtitle')}
          </Typography>
        </Box>
        <Chip
          label={canEdit ? t('editable') : t('readOnly')}
          color={canEdit ? 'success' : 'default'}
          size="small"
        />
      </Stack>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Tabs
            value={activeGroup}
            onChange={(_, value) => setActiveGroup(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
          >
            {SETTINGS_GROUPS.map((group) => (
              <Tab key={group.key} value={group.key} label={t(`groups.${group.key}`)} />
            ))}
          </Tabs>

          <Stack spacing={3} sx={{ p: 3 }}>
            <Box>
              <Typography variant="h6">{t(`groups.${activeGroup}`)}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t(`descriptions.${activeGroup}`)}
              </Typography>
            </Box>

            {settingsQuery.isError && (
              <Alert severity="error">{toAppApiError(settingsQuery.error).message}</Alert>
            )}

            {settingsQuery.isLoading ? (
              <Stack sx={{ alignItems: 'center', py: 5 }}>
                <CircularProgress />
              </Stack>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                {activeDefinition.fields.map(renderField)}
              </Box>
            )}

            {canEdit && (
              <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={updateSettings.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
                  disabled={settingsQuery.isLoading || updateSettings.isPending}
                  onClick={handleSubmit}
                >
                  {t('save', { group: t(`groups.${activeGroup}`) })}
                </Button>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
