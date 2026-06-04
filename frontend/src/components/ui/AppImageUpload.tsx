'use client'

import { useEffect, useMemo, useRef } from 'react'
import {
  Avatar,
  Box,
  Button,
  FormHelperText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { resolveAssetUrl } from '@/api/assets'
import { DeleteOutlined, ImageOutlined, UploadOutlined } from '@/components/ui/icons'

interface AppImageUploadProps {
  label: string
  value: string | null
  file: File | null
  onUrlChange: (value: string) => void
  onFileChange: (file: File | null) => void
  error?: boolean
  helperText?: React.ReactNode
  urlLabel?: string
  uploadLabel?: string
  removeLabel?: string
  hideUrlField?: boolean
  disabled?: boolean
  allowRemoveExisting?: boolean
}

export function AppImageUpload({
  label,
  value,
  file,
  onUrlChange,
  onFileChange,
  error,
  helperText,
  urlLabel,
  uploadLabel = 'Upload image',
  removeLabel = 'Remove',
  hideUrlField = false,
  disabled,
  allowRemoveExisting = true,
}: AppImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  const previewUrl = useMemo(() => objectUrl || resolveAssetUrl(value) || '', [objectUrl, value])

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">{label}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
        <Avatar
          variant="rounded"
          src={previewUrl}
          sx={{
            width: { xs: '100%', sm: 112 },
            height: 112,
            borderRadius: 1,
            bgcolor: 'action.hover',
            color: 'text.secondary',
            '& img': { objectFit: 'cover' },
          }}
        >
          <ImageOutlined />
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {!hideUrlField && (
            <TextField
              value={value ?? ''}
              onChange={(event) => onUrlChange(event.target.value)}
              label={urlLabel ?? label}
              error={error}
              helperText={helperText}
              disabled={disabled}
              fullWidth
            />
          )}
          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: hideUrlField ? 0 : 1.5, flexWrap: 'wrap', gap: 1 }}
          >
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadOutlined />}
              disabled={disabled}
            >
              {uploadLabel}
              <input
                ref={inputRef}
                hidden
                type="file"
                accept="image/*"
                onChange={(event) => {
                  onFileChange(event.target.files?.[0] ?? null)
                  event.target.value = ''
                }}
              />
            </Button>
            {(file || (allowRemoveExisting && value)) && (
              <Button
                variant="text"
                color="inherit"
                startIcon={<DeleteOutlined />}
                disabled={disabled}
                onClick={() => {
                  onFileChange(null)
                  onUrlChange('')
                  if (inputRef.current) inputRef.current.value = ''
                }}
              >
                {removeLabel}
              </Button>
            )}
          </Stack>
          {hideUrlField && helperText && (
            <FormHelperText error={error}>
              {helperText}
            </FormHelperText>
          )}
          {file && (
            <FormHelperText>
              {file.name}
            </FormHelperText>
          )}
        </Box>
      </Stack>
    </Stack>
  )
}
