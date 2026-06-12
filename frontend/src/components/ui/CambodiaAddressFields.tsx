'use client'

import { Autocomplete, Box, TextField } from '@mui/material'
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormSetValue,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  useCambodiaCommunesQuery,
  useCambodiaDistrictsQuery,
  useCambodiaProvincesQuery,
  useCambodiaVillagesQuery,
} from '@/features/address/hooks'
import type { CambodiaAddressDivision } from '@/features/address/types'

type AddressFieldName = 'country' | 'province_city' | 'district' | 'commune' | 'village'

type AddressFormValues = FieldValues & Partial<Record<AddressFieldName, string | null | undefined>>

interface CambodiaAddressFieldsProps<TValues extends AddressFormValues, TOutput extends FieldValues> {
  control: Control<TValues, unknown, TOutput>
  errors: FieldErrors<TValues>
  labels: Omit<Record<AddressFieldName, string>, 'country'> & { country?: string }
  setValue: UseFormSetValue<TValues>
  hideCountry?: boolean
}

const COUNTRY_OPTIONS = ['Cambodia']

function normalize(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

function getDivisionLabel(option: CambodiaAddressDivision, language: string) {
  if (language.startsWith('km') && option.name_km) return option.name_km

  return option.name_en || option.name_km || option.id
}

function findSelectedDivision(
  options: CambodiaAddressDivision[],
  value: string | null | undefined
) {
  const normalizedValue = normalize(value)
  if (normalizedValue === '') return null

  return options.find((option) => {
    return [option.id, option.name_en, option.name_km]
      .filter(Boolean)
      .some((candidate) => normalize(candidate) === normalizedValue)
  }) ?? null
}

function addressPath<TValues extends AddressFormValues>(name: AddressFieldName) {
  return name as Path<TValues>
}

function addressPathValue<TValues extends AddressFormValues>(value: string) {
  return value as PathValue<TValues, Path<TValues>>
}

function fieldError<TValues extends AddressFormValues>(
  errors: FieldErrors<TValues>,
  fieldName: AddressFieldName
) {
  return errors[fieldName] as { message?: string } | undefined
}

function useAddressValue<TValues extends AddressFormValues, TOutput extends FieldValues>(
  control: Control<TValues, unknown, TOutput>,
  name: AddressFieldName
) {
  return useWatch({ control, name: addressPath<TValues>(name) }) as string | null | undefined
}

export function CambodiaAddressFields<TValues extends AddressFormValues, TOutput extends FieldValues>({
  control,
  errors,
  labels,
  setValue,
  hideCountry = true,
}: CambodiaAddressFieldsProps<TValues, TOutput>) {
  const { i18n } = useTranslation()
  const country = useAddressValue(control, 'country')
  const province = useAddressValue(control, 'province_city')
  const district = useAddressValue(control, 'district')
  const commune = useAddressValue(control, 'commune')
  const isCambodia = normalize(country) === 'cambodia' || normalize(country) === '' || hideCountry

  const provincesQuery = useCambodiaProvincesQuery(isCambodia)
  const selectedProvince = findSelectedDivision(provincesQuery.data ?? [], province)
  const districtsQuery = useCambodiaDistrictsQuery(selectedProvince?.id ?? '', isCambodia)
  const selectedDistrict = findSelectedDivision(districtsQuery.data ?? [], district)
  const communesQuery = useCambodiaCommunesQuery(selectedDistrict?.id ?? '', isCambodia)
  const selectedCommune = findSelectedDivision(communesQuery.data ?? [], commune)
  const villagesQuery = useCambodiaVillagesQuery(selectedCommune?.id ?? '', isCambodia)

  const setAddressValue = (fieldName: AddressFieldName, value: string) => {
    setValue(addressPath<TValues>(fieldName), addressPathValue<TValues>(value), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const clearLowerFields = (fieldName: AddressFieldName) => {
    const fieldOrder: AddressFieldName[] = ['country', 'province_city', 'district', 'commune', 'village']
    const fieldIndex = fieldOrder.indexOf(fieldName)

    fieldOrder.slice(fieldIndex + 1).forEach((lowerField) => {
      setAddressValue(lowerField, '')
    })
  }

  const renderCountryField = () => (
    <Controller
      name={addressPath<TValues>('country')}
      control={control}
      render={({ field }) => (
        <Autocomplete
          freeSolo
          options={COUNTRY_OPTIONS}
          value={field.value ?? ''}
          inputValue={field.value ?? ''}
          onChange={(_, option) => {
            const nextValue = typeof option === 'string' ? option : option ?? ''
            field.onChange(nextValue)
            clearLowerFields('country')
          }}
          onInputChange={(_, inputValue, reason) => {
            if (reason === 'reset') return
            field.onChange(inputValue)
            clearLowerFields('country')
          }}
          renderInput={(params) => {
            const error = fieldError(errors, 'country')

            return (
              <TextField
                {...params}
                label={labels.country}
                error={!!error}
                helperText={error?.message}
              />
            )
          }}
        />
      )}
    />
  )

  const renderDivisionField = (
    fieldName: Exclude<AddressFieldName, 'country'>,
    options: CambodiaAddressDivision[],
    loading: boolean
  ) => (
    <Controller
      name={addressPath<TValues>(fieldName)}
      control={control}
      render={({ field }) => (
        <Autocomplete
          freeSolo
          options={options}
          loading={loading}
          value={findSelectedDivision(options, field.value) ?? null}
          inputValue={field.value ?? ''}
          getOptionLabel={(option) =>
            typeof option === 'string' ? option : getDivisionLabel(option, i18n.language)
          }
          isOptionEqualToValue={(option, selected) =>
            typeof selected !== 'string' && option.id === selected.id
          }
          onChange={(_, option) => {
            const nextValue =
              typeof option === 'string'
                ? option
                : option
                  ? getDivisionLabel(option, i18n.language)
                  : ''

            field.onChange(nextValue)
            clearLowerFields(fieldName)
          }}
          onInputChange={(_, inputValue, reason) => {
            if (reason === 'reset') return
            field.onChange(inputValue)
            clearLowerFields(fieldName)
          }}
          renderInput={(params) => {
            const error = fieldError(errors, fieldName)

            return (
              <TextField
                {...params}
                label={labels[fieldName]}
                error={!!error}
                helperText={error?.message}
              />
            )
          }}
        />
      )}
    />
  )

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: hideCountry ? 'repeat(4, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))',
        },
        gap: 1.5,
      }}
    >
      {!hideCountry && renderCountryField()}
      {renderDivisionField('province_city', provincesQuery.data ?? [], provincesQuery.isLoading)}
      {renderDivisionField(
        'district',
        districtsQuery.data ?? [],
        districtsQuery.isLoading
      )}
      {renderDivisionField(
        'commune',
        communesQuery.data ?? [],
        communesQuery.isLoading
      )}
      {renderDivisionField(
        'village',
        villagesQuery.data ?? [],
        villagesQuery.isLoading
      )}
    </Box>
  )
}
