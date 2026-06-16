'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { ArrowBack, SaveOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import {
  useCreateProductMutation,
  useProductFormOptionsQuery,
  useProductQuery,
  useUpdateProductMutation,
} from './hooks'
import { productSchema, type ProductFormInput, type ProductFormValues } from './schema'
import type { Product, ProductPayload, ProductType } from '@/types/product'
import type { CustomFieldDefinition } from '@/types/product'
import type { VariationTemplate } from '@/types/variationTemplate'
import { ProductCatalogSection } from './components/ProductCatalogSection'
import { ProductComboSection } from './components/ProductComboSection'
import { ProductCustomFieldsSection } from './components/ProductCustomFieldsSection'
import { ProductGeneralSection } from './components/ProductGeneralSection'
import { ProductPricingSection } from './components/ProductPricingSection'
import { ProductStockSection } from './components/ProductStockSection'
import { ProductVariationsSection } from './components/ProductVariationsSection'

interface ProductFormPageProps {
  productId?: string
}

const defaultValues: ProductFormInput = {
  category_id: '',
  brand_id: '',
  unit_id: '',
  sub_unit_id: '',
  tax_rate_id: '',
  rack_location_id: '',
  price_group_id: '',
  variation_template_id: '',
  variation_template_ids: [],
  variation_value_map: {},
  excluded_variation_keys: [],
  name: '',
  description: '',
  sku: '',
  barcode_type: 'C128',
  type: 'single',
  stock_tracking: 'none',
  has_expiry: false,
  selling_price: '',
  purchase_price: '',
  sub_unit_selling_price: '',
  sub_unit_purchase_price: '',
  minimum_selling_price: '',
  profit_margin: '',
  tax_type: 'exclusive',
  track_inventory: true,
  alert_quantity: '',
  max_stock_level: '',
  is_for_selling: true,
  is_active: true,
  weight: '',
  image_file: null,
  custom_fields: {},
  variations: [],
  combo_items: [],
}

function idsForProduct(product: Product | null) {
  if (!product) return []
  return product.variation_template_ids?.length
    ? product.variation_template_ids
    : product.variation_template_id
      ? [product.variation_template_id]
      : []
}

function buildValueMap(product: Product | null, templates: VariationTemplate[]) {
  const templateIds = idsForProduct(product)
  const valueToTemplate = new Map<string, string>()

  templates.forEach((template) => {
    template.values.forEach((value) => valueToTemplate.set(value.id, template.id))
  })

  const map: Record<string, string[]> = Object.fromEntries(templateIds.map((id) => [id, []]))

  product?.variations?.forEach((variation) => {
    variation.variation_value_ids?.forEach((valueId) => {
      const templateId = valueToTemplate.get(valueId)
      if (!templateId || !templateIds.includes(templateId)) return
      map[templateId] ??= []
      if (!map[templateId].includes(valueId)) map[templateId].push(valueId)
    })
  })

  return map
}

function customFieldsToFormValue(customFields: Product['custom_fields']) {
  if (!customFields || Array.isArray(customFields)) return {}
  return customFields
}

function productToFormValues(product: Product | null, templates: VariationTemplate[]): ProductFormInput {
  if (!product) return defaultValues

  const templateIds = idsForProduct(product)

  return {
    ...defaultValues,
    category_id: product.category_id ?? '',
    brand_id: product.brand_id ?? '',
    unit_id: product.unit_id ?? '',
    sub_unit_id: product.sub_unit_id ?? '',
    tax_rate_id: product.tax_rate_id ?? '',
    rack_location_id: product.rack_location_id ?? '',
    price_group_id: product.price_group_id ?? '',
    variation_template_id: templateIds[0] ?? '',
    variation_template_ids: templateIds,
    variation_value_map: buildValueMap(product, templates),
    name: product.name,
    description: product.description ?? '',
    sku: product.sku ?? '',
    barcode_type: product.barcode_type,
    type: product.type,
    stock_tracking: product.stock_tracking,
    has_expiry: product.has_expiry,
    selling_price: product.selling_price ?? '',
    purchase_price: product.purchase_price ?? '',
    sub_unit_selling_price: product.sub_unit_selling_price ?? '',
    sub_unit_purchase_price: product.sub_unit_purchase_price ?? '',
    minimum_selling_price: product.minimum_selling_price ?? '',
    profit_margin: product.profit_margin ?? '',
    tax_type: product.tax_type,
    track_inventory: product.track_inventory,
    alert_quantity: product.alert_quantity ?? '',
    max_stock_level: product.max_stock_level ?? '',
    is_for_selling: product.is_for_selling,
    is_active: product.is_active,
    weight: product.weight ?? '',
    image_file: null,
    custom_fields: customFieldsToFormValue(product.custom_fields),
    variations:
      product.variations?.map((variation) => ({
        id: variation.id ?? undefined,
        name: variation.name,
        variation_value_ids: variation.variation_value_ids ?? [],
        sku: variation.sku ?? undefined,
        sub_unit_id: variation.sub_unit_id ?? undefined,
        selling_price: variation.selling_price ?? '',
        purchase_price: variation.purchase_price ?? '',
        sub_unit_selling_price: variation.sub_unit_selling_price ?? undefined,
        sub_unit_purchase_price: variation.sub_unit_purchase_price ?? undefined,
        minimum_selling_price: variation.minimum_selling_price ?? undefined,
        profit_margin: variation.profit_margin ?? undefined,
        is_active: variation.is_active ?? true,
        image_file: null,
      })) ?? [],
    combo_items:
      product.combo_items?.map((item) => ({
        id: item.id ?? undefined,
        child_product_id: item.child_product_id,
        child_variation_id: item.child_variation_id ?? undefined,
        quantity: item.quantity ?? 1,
      })) ?? [],
  }
}

function compactPayload(values: ProductFormValues): ProductPayload {
  const templateIds = values.variation_template_ids?.length
    ? values.variation_template_ids
    : values.variation_template_id
      ? [values.variation_template_id]
      : []

  const payload: ProductPayload = {
    category_id: values.category_id,
    brand_id: values.brand_id,
    unit_id: values.unit_id,
    sub_unit_id: values.type === 'single' ? values.sub_unit_id : null,
    tax_rate_id: values.tax_rate_id,
    rack_location_id: values.rack_location_id,
    price_group_id: values.price_group_id,
    name: values.name,
    description: values.description,
    sku: values.sku,
    barcode_type: values.barcode_type,
    type: values.type,
    stock_tracking: values.type === 'combo' || !values.track_inventory ? 'none' : values.stock_tracking,
    has_expiry: values.has_expiry,
    tax_type: values.tax_type,
    track_inventory: values.type === 'combo' || values.type === 'service' ? false : values.track_inventory,
    alert_quantity: values.alert_quantity,
    max_stock_level: values.max_stock_level,
    sub_unit_selling_price: values.type === 'variable' ? null : values.sub_unit_selling_price,
    sub_unit_purchase_price: values.type === 'variable' ? null : values.sub_unit_purchase_price,
    minimum_selling_price: values.type === 'variable' ? null : values.minimum_selling_price,
    profit_margin: values.profit_margin,
    is_for_selling: values.is_for_selling,
    is_active: values.is_active,
    weight: values.weight,
    image_file: values.image_file,
    custom_fields: normalizeCustomFields(values.custom_fields),
  }

  if (values.type !== 'variable') {
    payload.selling_price = values.selling_price
    payload.purchase_price = values.purchase_price
  }

  if (values.type === 'variable') {
    payload.variation_template_id = templateIds[0] ?? null
    payload.variation_template_ids = templateIds
    payload.variations = values.variations
  }

  if (values.type === 'combo') {
    payload.combo_items = values.combo_items
  }

  return payload
}

function normalizeCustomFields(customFields: ProductFormValues['custom_fields']) {
  if (customFields === null || customFields === undefined) return null

  return Object.fromEntries(
    Object.entries(customFields).map(([key, value]) => [key, value === '' ? null : value])
  )
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== ''
}

function firstErrorMessage(errors: FieldErrors<ProductFormInput>): string | null {
  for (const value of Object.values(errors)) {
    if (!value) continue
    if ('message' in value && typeof value.message === 'string') return value.message
    if (typeof value === 'object') {
      const nested = firstErrorMessage(value as FieldErrors<ProductFormInput>)
      if (nested) return nested
    }
  }

  return null
}

export function ProductFormPage({ productId }: ProductFormPageProps) {
  const router = useRouter()
  const { t } = useTranslation(['products', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const [serverError, setServerError] = useState('')
  const [clientError, setClientError] = useState('')
  const isEdit = !!productId

  const optionsQuery = useProductFormOptionsQuery()
  const productQuery = useProductQuery(productId ?? null)
  const createProduct = useCreateProductMutation()
  const updateProduct = useUpdateProductMutation()

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  })

  const type = useWatch({ control, name: 'type' }) as ProductType
  const selectedUnitId = useWatch({ control, name: 'unit_id' })
  const watchedTemplateIds = useWatch({ control, name: 'variation_template_ids' })
  const selectedTemplateIds = useMemo(() => watchedTemplateIds ?? [], [watchedTemplateIds])
  const variationValueMap = useWatch({ control, name: 'variation_value_map' }) ?? {}
  const selectedUnit = optionsQuery.data?.units.find((unit) => unit.id === selectedUnitId)
  const subUnits = selectedUnit?.sub_units ?? []
  const comboItems = useFieldArray({ control, name: 'combo_items' })

  useEffect(() => {
    if (!optionsQuery.data) return
    if (isEdit && !productQuery.data) return
    reset(productToFormValues(productQuery.data ?? null, optionsQuery.data.variation_templates))
  }, [isEdit, optionsQuery.data, productQuery.data, reset])

  const selectedTemplates = useMemo(
    () => optionsQuery.data?.variation_templates.filter((template) => selectedTemplateIds.includes(template.id)) ?? [],
    [optionsQuery.data?.variation_templates, selectedTemplateIds]
  )

  const valueLabelMap = useMemo(() => {
    const labels = new Map<string, string>()
    optionsQuery.data?.variation_templates.forEach((template) => {
      template.values.forEach((value) => labels.set(value.id, value.name))
    })
    return labels
  }, [optionsQuery.data?.variation_templates])

  const syncMatrix = (templateIds: string[], valueMap: Record<string, string[]>) => {
    const groups = templateIds.map((templateId) => valueMap[templateId] ?? [])
    if (!templateIds.length || groups.some((group) => group.length === 0)) {
      setValue('variations', [])
      return
    }

    const existing = new Map(
      (getValues('variations') ?? []).map((variation) => [
        (variation.variation_value_ids ?? []).join('|'),
        variation,
      ])
    )
    const combinations = groups.reduce<string[][]>(
      (accumulator, group) => accumulator.flatMap((item) => group.map((value) => [...item, value])),
      [[]]
    )

    setValue(
      'variations',
      combinations.map((valueIds) => {
        const key = valueIds.join('|')
        const previous = existing.get(key)
        return {
          id: previous?.id ?? undefined,
          name: valueIds.map((id) => valueLabelMap.get(id) ?? id).join('-'),
          variation_value_ids: valueIds,
          sku: previous?.sku ?? '',
          sub_unit_id: previous?.sub_unit_id ?? undefined,
          selling_price: previous?.selling_price ?? '',
          purchase_price: previous?.purchase_price ?? '',
          sub_unit_selling_price: previous?.sub_unit_selling_price ?? undefined,
          sub_unit_purchase_price: previous?.sub_unit_purchase_price ?? undefined,
          minimum_selling_price: previous?.minimum_selling_price ?? undefined,
          profit_margin: previous?.profit_margin ?? undefined,
          is_active: previous?.is_active ?? true,
        }
      }),
      { shouldValidate: true }
    )
  }

  const validateCustomFields = (definitions: CustomFieldDefinition[], values: ProductFormValues) => {
    let valid = true

    definitions.forEach((definition) => {
      if (!definition.is_required) return

      const value = values.custom_fields?.[definition.field_name]
      if (hasValue(value)) return

      valid = false
      setError(`custom_fields.${definition.field_name}` as keyof ProductFormInput, {
        type: 'required',
        message: t('validation.requiredField', { field: definition.field_label }),
      })
    })

    return valid
  }

  const submitForm = async (values: ProductFormValues) => {
    setServerError('')
    setClientError('')

    if (!validateCustomFields(optionsQuery.data?.custom_fields ?? [], values)) {
      setClientError(t('messages.fixValidationErrors'))
      return
    }

    try {
      if (productId) {
        await updateProduct.mutateAsync({ id: productId, payload: compactPayload(values) })
        enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      } else {
        await createProduct.mutateAsync(compactPayload(values))
        enqueueSnackbar(t('messages.created'), { variant: 'success' })
      }
      router.push('/products')
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof ProductFormInput, { type: 'server', message: messages[0] })
        })
      }
      setServerError(apiError.message)
    }
  }

  const handleInvalid = (formErrors: FieldErrors<ProductFormInput>) => {
    setServerError('')
    setClientError(firstErrorMessage(formErrors) ?? t('messages.fixValidationErrors'))
  }

  const loading = optionsQuery.isLoading || (isEdit && productQuery.isLoading)
  const saving = createProduct.isPending || updateProduct.isPending

  return (
    <Stack spacing={3}>
      <PageHeader
        title={isEdit ? t('form.editTitle') : t('form.createTitle')}
        description={t('form.pageSubtitle')}
        actions={
          <Button startIcon={<ArrowBack />} onClick={() => router.push('/products')}>
            {t('actions.backToProducts')}
          </Button>
        }
      />

      {(clientError || serverError || optionsQuery.isError || productQuery.isError) && (
        <Alert severity="error">
          {clientError || serverError || toAppApiError(optionsQuery.error ?? productQuery.error).message}
        </Alert>
      )}

      {loading ? (
        <Card><CardContent><CircularProgress size={24} /></CardContent></Card>
      ) : (
        <Box component="form" noValidate onSubmit={handleSubmit(submitForm, handleInvalid)}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Stack spacing={3}>
                  <ProductGeneralSection
                    control={control}
                    errors={errors}
                    imageUrl={productQuery.data?.image_url}
                    t={t}
                  />

                  <Divider />

                  <ProductCatalogSection
                    control={control}
                    errors={errors}
                    options={optionsQuery.data}
                    subUnits={subUnits}
                    type={type}
                    t={t}
                  />

                  <Divider />

                  <ProductPricingSection control={control} errors={errors} type={type} t={t} />

                  <Divider />

                  <ProductStockSection control={control} t={t} />

                  <ProductCustomFieldsSection
                    control={control}
                    errors={errors}
                    fields={optionsQuery.data?.custom_fields ?? []}
                    t={t}
                  />
                </Stack>
              </CardContent>
            </Card>

            {type === 'variable' && (
              <Card>
                <CardContent>
                  <ProductVariationsSection
                    control={control}
                    errors={errors}
                    templates={optionsQuery.data?.variation_templates ?? []}
                    selectedTemplates={selectedTemplates}
                    selectedTemplateIds={selectedTemplateIds}
                    variationValueMap={variationValueMap}
                    valueLabelMap={valueLabelMap}
                    subUnits={subUnits}
                    setValue={setValue}
                    syncMatrix={syncMatrix}
                    t={t}
                  />
                </CardContent>
              </Card>
            )}

            {type === 'combo' && (
              <Card>
                <CardContent>
                  <ProductComboSection
                    control={control}
                    errors={errors}
                    comboItems={comboItems}
                    options={optionsQuery.data}
                    t={t}
                  />
                </CardContent>
              </Card>
            )}

            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => router.push('/products')} disabled={saving}>{t('common:buttons.cancel')}</Button>
              <Button type="submit" variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />} disabled={saving}>
                {t('common:buttons.save')}
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}
    </Stack>
  )
}
