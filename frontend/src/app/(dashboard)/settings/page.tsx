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
import { SaveOutlined, SettingsOutlined, UploadOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { useCambodiaAddressSyncStatusQuery, useSyncCambodiaAddressMutation } from '@/features/address/hooks'
import { BusinessProfileSettingsCard } from '@/features/settings/BusinessProfileSettingsCard'
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
  const canViewBusiness = can('businesses.index')
  const canEditBusiness = can('businesses.edit')
  const [activeGroup, setActiveGroup] = useState<SettingsGroupKey>('general')
  const activeDefinition = useMemo(
    () => SETTINGS_GROUPS.find((group) => group.key === activeGroup) ?? SETTINGS_GROUPS[0],
    [activeGroup]
  )
  const isBusinessProfileGroup = activeGroup === 'business_profile'
  const settingsQuery = useSettingsGroupQuery(activeGroup, !isBusinessProfileGroup)
  const updateSettings = useUpdateSettingsGroupMutation(activeGroup)
  const activeCanEdit = isBusinessProfileGroup ? canEditBusiness : canEdit
  const addressSyncStatusQuery = useCambodiaAddressSyncStatusQuery(activeGroup === 'system')
  const syncCambodiaAddress = useSyncCambodiaAddressMutation()
  const [draftByGroup, setDraftByGroup] = useState<Partial<Record<SettingsGroupKey, Record<string, unknown>>>>({})
  const groupDraft = draftByGroup[activeGroup] ?? {}
  const addressSyncStatus = addressSyncStatusQuery.data
  const addressCounts = addressSyncStatus?.counts
  const lastAddressSync = addressSyncStatus?.last_synced_at
    ? new Date(addressSyncStatus.last_synced_at).toLocaleString()
    : t('cambodiaAddress.neverSynced')

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
    if (isBusinessProfileGroup) return

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

  const handleSyncCambodiaAddress = async () => {
    try {
      const result = await syncCambodiaAddress.mutateAsync()
      enqueueSnackbar(t('cambodiaAddress.syncSuccess', { total: result.total }), { variant: 'success' })
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
          label={activeCanEdit ? t('editable') : t('readOnly')}
          color={activeCanEdit ? 'success' : 'default'}
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

            {settingsQuery.isError && !isBusinessProfileGroup && (
              <Alert severity="error">{toAppApiError(settingsQuery.error).message}</Alert>
            )}

            {isBusinessProfileGroup && (
              <BusinessProfileSettingsCard
                canView={canViewBusiness}
                canEdit={canEditBusiness}
              />
            )}

            {!isBusinessProfileGroup && settingsQuery.isLoading ? (
              <Stack sx={{ alignItems: 'center', py: 5 }}>
                <CircularProgress />
              </Stack>
            ) : !isBusinessProfileGroup ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                {activeDefinition.fields.map(renderField)}
              </Box>
            ) : null}

            {activeGroup === 'system' && (
              <Box
                sx={{
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  p: 2,
                }}
              >
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography variant="subtitle1">{t('cambodiaAddress.title')}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      {t('cambodiaAddress.description')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                      {t('cambodiaAddress.lastSynced', { value: lastAddressSync })}
                    </Typography>
                    {addressCounts && (
                      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 1 }}>
                        <Chip size="small" label={t('cambodiaAddress.provinces', { count: addressCounts.provinces })} />
                        <Chip size="small" label={t('cambodiaAddress.districts', { count: addressCounts.districts })} />
                        <Chip size="small" label={t('cambodiaAddress.communes', { count: addressCounts.communes })} />
                        <Chip size="small" label={t('cambodiaAddress.villages', { count: addressCounts.villages })} />
                      </Stack>
                    )}
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={syncCambodiaAddress.isPending ? <CircularProgress size={18} color="inherit" /> : <UploadOutlined />}
                    disabled={!canEdit || syncCambodiaAddress.isPending}
                    onClick={handleSyncCambodiaAddress}
                    sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}
                  >
                    {syncCambodiaAddress.isPending ? t('cambodiaAddress.syncing') : t('cambodiaAddress.sync')}
                  </Button>
                </Stack>
              </Box>
            )}

            {canEdit && !isBusinessProfileGroup && (
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
