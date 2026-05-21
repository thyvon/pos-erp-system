'use client'

import { Autocomplete, Box, TextField, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

interface SearchableFilterSelectProps<TOption> {
  label: string
  value: string
  options: TOption[]
  getOptionValue: (option: TOption) => string
  getOptionLabel: (option: TOption) => string
  getOptionDescription?: (option: TOption) => string | null | undefined
  onChange: (value: string) => void
  loading?: boolean
  placeholder?: string
  sx?: SxProps<Theme>
}

export function SearchableFilterSelect<TOption>({
  label,
  value,
  options,
  getOptionValue,
  getOptionLabel,
  getOptionDescription,
  onChange,
  loading = false,
  placeholder,
  sx,
}: SearchableFilterSelectProps<TOption>) {
  const selectedOption = options.find((option) => getOptionValue(option) === value) ?? null

  return (
    <Autocomplete
      options={options}
      value={selectedOption}
      loading={loading}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, selected) => getOptionValue(option) === getOptionValue(selected)}
      onChange={(_, option) => onChange(option ? getOptionValue(option) : '')}
      sx={sx}
      renderOption={(props, option) => {
        const description = getOptionDescription?.(option)
        const { key, ...optionProps } = props

        return (
          <Box component="li" key={key} {...optionProps}>
            <Box>
              <Typography variant="body2">{getOptionLabel(option)}</Typography>
              {description && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {description}
                </Typography>
              )}
            </Box>
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
        />
      )}
    />
  )
}
