'use client'

import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/km'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useTranslation } from 'react-i18next'

interface AppDatePickerProps {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  error?: boolean
  helperText?: React.ReactNode
  required?: boolean
  disabled?: boolean
  disableFuture?: boolean
  disablePast?: boolean
  minDate?: string | null
  maxDate?: string | null
}

function toDayjs(value: string | null | undefined, locale: string) {
  if (!value) return null

  const date = dayjs(value).locale(locale)
  return date.isValid() ? date : null
}

function toDateString(value: Dayjs | null) {
  if (!value || !value.isValid()) return null

  return value.format('YYYY-MM-DD')
}

function toOptionalDayjs(value: string | null | undefined, locale: string) {
  return toDayjs(value, locale) ?? undefined
}

export function AppDatePicker({
  label,
  value,
  onChange,
  error,
  helperText,
  required,
  disabled,
  disableFuture,
  disablePast,
  minDate,
  maxDate,
}: AppDatePickerProps) {
  const { i18n } = useTranslation()
  const locale = i18n.language.startsWith('km') ? 'km' : 'en'
  const displayFormat = locale === 'km' ? 'D MMMM YYYY' : 'MMMM D, YYYY'

  return (
    <DatePicker
      label={label}
      value={toDayjs(value, locale)}
      onChange={(nextValue) => onChange(toDateString(nextValue))}
      format={displayFormat}
      disabled={disabled}
      disableFuture={disableFuture}
      disablePast={disablePast}
      minDate={toOptionalDayjs(minDate, locale)}
      maxDate={toOptionalDayjs(maxDate, locale)}
      slotProps={{
        textField: {
          error,
          helperText,
          required,
          fullWidth: true,
        },
      }}
    />
  )
}
