'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import type {
  ManagedBusiness,
  ManagedBusinessModule,
  ManagedBusinessModulePayload,
  ManagedBusinessModuleStatus,
} from '@/types/businessManagement'

interface BusinessModulesDialogProps {
  open: boolean
  business: ManagedBusiness | null
  modules: ManagedBusinessModule[]
  isLoading: boolean
  isSaving: boolean
  error: unknown
  onClose: () => void
  onSubmit: (modules: ManagedBusinessModulePayload[]) => Promise<void>
}

interface ModuleDraft {
  module_key: string
  status: ManagedBusinessModuleStatus
  starts_at: string
  ends_at: string
  limits: string
  settings: string
}

const statusOptions: ManagedBusinessModuleStatus[] = ['active', 'trial', 'expired', 'disabled']

function formatDateInput(value: string | null) {
  return value ? value.slice(0, 10) : ''
}

function stringifyJson(value: Record<string, unknown> | null) {
  return value ? JSON.stringify(value, null, 2) : ''
}

function parseJson(value: string, label: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    const parsed = JSON.parse(trimmed)
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error()
    }

    return parsed as Record<string, unknown>
  } catch {
    throw new Error(`${label} must be a valid JSON object.`)
  }
}

function moduleToDraft(module: ManagedBusinessModule): ModuleDraft {
  return {
    module_key: module.module_key,
    status: module.status,
    starts_at: formatDateInput(module.starts_at),
    ends_at: formatDateInput(module.ends_at),
    limits: stringifyJson(module.limits),
    settings: stringifyJson(module.settings),
  }
}

export function BusinessModulesDialog({
  open,
  business,
  modules,
  isLoading,
  isSaving,
  error,
  onClose,
  onSubmit,
}: BusinessModulesDialogProps) {
  const { t } = useTranslation(['businesses', 'common'])
  const [edits, setEdits] = useState<Record<string, ModuleDraft>>({})
  const [formError, setFormError] = useState('')

  const moduleMap = useMemo(() => new Map(modules.map((moduleInfo) => [moduleInfo.module_key, moduleInfo])), [modules])
  const drafts = useMemo(
    () => modules.map((moduleInfo) => edits[moduleInfo.module_key] ?? moduleToDraft(moduleInfo)),
    [edits, modules]
  )

  const updateDraft = (moduleKey: string, patch: Partial<ModuleDraft>) => {
    const current = drafts.find((draft) => draft.module_key === moduleKey)
    if (!current) return

    setEdits((existing) => ({
      ...existing,
      [moduleKey]: { ...current, ...patch },
    }))
  }

  const handleClose = () => {
    setEdits({})
    setFormError('')
    onClose()
  }

  const handleSubmit = async () => {
    setFormError('')

    try {
      const payload = drafts.map((draft) => ({
        module_key: draft.module_key,
        status: draft.status,
        starts_at: draft.starts_at || null,
        ends_at: draft.ends_at || null,
        limits: parseJson(draft.limits, t('modules.fields.limits')),
        settings: parseJson(draft.settings, t('modules.fields.settings')),
      }))

      await onSubmit(payload)
      setEdits({})
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : t('modules.errors.invalidJson'))
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
      <DialogTitle>
        {t('modules.title', { name: business?.name ?? '' })}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('modules.subtitle')}
          </Typography>

          {Boolean(error) && (
            <Alert severity="error">
              {toAppApiError(error).message}
            </Alert>
          )}

          {formError && <Alert severity="error">{formError}</Alert>}

          {isLoading ? (
            <Stack sx={{ py: 4, alignItems: 'center' }}>
              <CircularProgress size={28} />
            </Stack>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('modules.columns.module')}</TableCell>
                    <TableCell sx={{ width: 150 }}>{t('modules.columns.status')}</TableCell>
                    <TableCell sx={{ width: 150 }}>{t('modules.columns.startsAt')}</TableCell>
                    <TableCell sx={{ width: 150 }}>{t('modules.columns.endsAt')}</TableCell>
                    <TableCell sx={{ width: 220 }}>{t('modules.columns.limits')}</TableCell>
                    <TableCell sx={{ width: 220 }}>{t('modules.columns.settings')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {drafts.map((draft) => {
                    const moduleInfo = moduleMap.get(draft.module_key)
                    const isCore = draft.module_key === 'core'

                    return (
                      <TableRow key={draft.module_key} hover>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                              <Typography variant="subtitle2">{moduleInfo?.name ?? draft.module_key}</Typography>
                              {moduleInfo?.enabled && (
                                <Chip size="small" color="success" label={t('modules.enabled')} />
                              )}
                            </Stack>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {moduleInfo?.description}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <TextField
                            select
                            fullWidth
                            value={draft.status}
                            disabled={isCore}
                            onChange={(event) => updateDraft(draft.module_key, {
                              status: event.target.value as ManagedBusinessModuleStatus,
                            })}
                          >
                            {statusOptions.map((status) => (
                              <MenuItem key={status} value={status}>
                                {t(`modules.statuses.${status}`)}
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            fullWidth
                            value={draft.starts_at}
                            onChange={(event) => updateDraft(draft.module_key, { starts_at: event.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            fullWidth
                            value={draft.ends_at}
                            onChange={(event) => updateDraft(draft.module_key, { ends_at: event.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            value={draft.limits}
                            placeholder="{}"
                            onChange={(event) => updateDraft(draft.module_key, { limits: event.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            value={draft.settings}
                            placeholder="{}"
                            onChange={(event) => updateDraft(draft.module_key, { settings: event.target.value })}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleClose}>
          {t('common:buttons.cancel')}
        </Button>
        <Button variant="contained" disabled={isSaving || isLoading} onClick={handleSubmit}>
          {isSaving ? t('common:buttons.saving') : t('common:buttons.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
