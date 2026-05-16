'use client'

import { useRouter } from 'next/navigation'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { ArrowBack, EditOutlined, ImageOutlined } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { useProductFormOptionsQuery, useProductQuery } from './hooks'
import { useAuthStore } from '@/stores/authStore'
import type { ComboItem, Product, ProductVariation } from '@/types/product'

interface ProductDetailPageProps {
  productId: string
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

function customFieldsToEntries(customFields: Product['custom_fields']) {
  if (!customFields || Array.isArray(customFields)) return []
  return Object.entries(customFields)
}

function DetailItem({ label, value, inline = false }: { label: string; value: React.ReactNode; inline?: boolean }) {
  if (!inline) {
    return (
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
          {value}
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'max-content minmax(0, 1fr)',
        columnGap: 0.75,
        alignItems: 'baseline',
        minWidth: 0,
      }}
    >
      <Typography variant="body2" component="span" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
        {label}:
      </Typography>
      <Typography variant="body2" component="span" sx={{ fontWeight: 600, overflowWrap: 'anywhere', minWidth: 0 }}>
        {value}
      </Typography>
    </Box>
  )
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
        gap: { xs: 2, md: 2.5 },
      }}
    >
      {children}
    </Box>
  )
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack spacing={2.25}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {children}
    </Stack>
  )
}

export function ProductDetailPage({ productId }: ProductDetailPageProps) {
  const router = useRouter()
  const { t } = useTranslation(['products', 'common'])
  const can = useAuthStore((state) => state.can)
  const productQuery = useProductQuery(productId)
  const optionsQuery = useProductFormOptionsQuery()
  const product = productQuery.data
  const canEdit = can('products.edit')

  if (productQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 180 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  if (productQuery.isError || !product) {
    return <Alert severity="error">{toAppApiError(productQuery.error).message}</Alert>
  }

  const customFieldEntries = customFieldsToEntries(product.custom_fields)
  const customFieldLabels = new Map(
    (optionsQuery.data?.custom_fields ?? []).map((definition) => [definition.field_name, definition.field_label])
  )
  const hasProductLevelPricing = product.type !== 'variable'
  const hasSingleSubUnitPricing = product.type === 'single'
  const hasStockSettings = product.type === 'single' || product.type === 'variable'

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={2} sx={{ minWidth: 0, alignItems: 'center' }}>
          <Avatar
            variant="rounded"
            src={product.image_url ?? ''}
            sx={{ width: 56, height: 56, borderRadius: 1, bgcolor: 'action.hover', color: 'text.secondary' }}
          >
            <ImageOutlined />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="h4" sx={{ overflowWrap: 'anywhere' }}>
                {product.name}
              </Typography>
              <Chip size="small" variant="outlined" label={t(`types.${product.type}`)} />
              <Chip
                size="small"
                color={product.is_active ? 'success' : 'default'}
                variant="outlined"
                label={product.is_active ? t('common:status.active') : t('common:status.inactive')}
              />
            </Stack>
            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
              {product.sku || t('labels.noSku')}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ justifyContent: { xs: 'flex-end', md: 'initial' } }}>
          <Button startIcon={<ArrowBack />} onClick={() => router.push('/products')}>
            {t('actions.backToProducts')}
          </Button>
          {canEdit && (
            <Button variant="contained" startIcon={<EditOutlined />} onClick={() => router.push(`/products/${product.id}/edit`)}>
              {t('actions.editProduct')}
            </Button>
          )}
        </Stack>
      </Stack>

      <Box
        sx={{
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '280px minmax(0, 1fr)' },
            minHeight: 420,
          }}
        >
          <Box
            sx={{
              borderRight: { xs: 0, lg: 1 },
              borderBottom: { xs: 1, lg: 0 },
              borderColor: 'divider',
              p: 3,
            }}
          >
            <Stack spacing={2.5}>
              <Avatar
                variant="rounded"
                src={product.image_url ?? ''}
                sx={{
                  width: '100%',
                  height: 190,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  color: 'text.secondary',
                  '& .MuiSvgIcon-root': { fontSize: 42 },
                }}
              >
                <ImageOutlined />
              </Avatar>

              <Stack spacing={1.5}>
                <DetailItem inline label={t('fields.sku')} value={product.sku || t('labels.noSku')} />
                <DetailItem inline label={t('fields.barcodeType')} value={product.barcode_type} />
                <DetailItem inline label={t('fields.type')} value={t(`types.${product.type}`)} />
                <DetailItem
                  inline
                  label={t('fields.is_active')}
                  value={product.is_active ? t('common:status.active') : t('common:status.inactive')}
                />
              </Stack>

              <Divider />

              <DetailBlock title={t('sections.catalog')}>
                <Stack spacing={1.5}>
                  <DetailItem inline label={t('fields.category')} value={product.category?.name ?? '-'} />
                  <DetailItem inline label={t('fields.brand')} value={product.brand?.name ?? '-'} />
                  {product.type !== 'service' && <DetailItem inline label={t('fields.unit')} value={product.unit?.name ?? '-'} />}
                  {hasSingleSubUnitPricing && <DetailItem inline label={t('fields.subUnit')} value={product.sub_unit?.name ?? '-'} />}
                  <DetailItem
                    inline
                    label={t('fields.rackLocation')}
                    value={product.rack_location ? `${product.rack_location.name} (${product.rack_location.code})` : '-'}
                  />
                </Stack>
              </DetailBlock>

              <Divider />

              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Chip size="small" variant="outlined" label={t(`types.${product.type}`)} />
                <Chip
                  size="small"
                  variant="outlined"
                  label={product.track_inventory ? t('labels.tracked') : t('labels.notTracked')}
                />
                <Chip
                  size="small"
                  color={product.is_for_selling ? 'success' : 'default'}
                  variant="outlined"
                  label={product.is_for_selling ? t('fields.is_for_selling') : t('labels.no')}
                />
              </Stack>
            </Stack>
          </Box>

          <Stack spacing={3} sx={{ p: { xs: 2.5, md: 3 } }} divider={<Divider flexItem />}>
            <DetailBlock title={t('sections.general')}>
              <DetailGrid>
                <DetailItem label={t('fields.name')} value={product.name} />
                <DetailItem label={t('fields.description')} value={product.description || t('labels.noDescription')} />
                <DetailItem label={t('fields.barcode')} value={product.sku || t('labels.noSku')} />
              </DetailGrid>
            </DetailBlock>

            <DetailBlock title={t('sections.pricing')}>
              <DetailGrid>
                {hasProductLevelPricing && (
                  <>
                    <DetailItem label={t('fields.sellingPrice')} value={displayValue(product.selling_price)} />
                    <DetailItem label={t('fields.purchasePrice')} value={displayValue(product.purchase_price)} />
                    {hasSingleSubUnitPricing && (
                      <>
                        <DetailItem label={t('fields.subUnitSellingPrice')} value={displayValue(product.sub_unit_selling_price)} />
                        <DetailItem label={t('fields.subUnitPurchasePrice')} value={displayValue(product.sub_unit_purchase_price)} />
                      </>
                    )}
                    <DetailItem label={t('fields.minimumSellingPrice')} value={displayValue(product.minimum_selling_price)} />
                    <DetailItem label={t('fields.profitMargin')} value={displayValue(product.profit_margin)} />
                  </>
                )}
                <DetailItem label={t('fields.taxRate')} value={product.tax_rate?.name ?? '-'} />
                <DetailItem label={t('fields.taxType')} value={t(`taxTypes.${product.tax_type}`)} />
                <DetailItem label={t('fields.priceGroup')} value={product.price_group?.name ?? '-'} />
              </DetailGrid>
            </DetailBlock>

            {hasStockSettings && (
              <DetailBlock title={t('sections.stock')}>
                <DetailGrid>
                  <DetailItem label={t('fields.track_inventory')} value={product.track_inventory ? t('labels.yes') : t('labels.no')} />
                  {product.track_inventory && (
                    <>
                      <DetailItem label={t('fields.stockTracking')} value={t(`stockTracking.${product.stock_tracking}`)} />
                      <DetailItem label={t('fields.has_expiry')} value={product.has_expiry ? t('labels.yes') : t('labels.no')} />
                      <DetailItem label={t('fields.alertQuantity')} value={displayValue(product.alert_quantity)} />
                      <DetailItem label={t('fields.maxStockLevel')} value={displayValue(product.max_stock_level)} />
                    </>
                  )}
                  <DetailItem label={t('fields.is_for_selling')} value={product.is_for_selling ? t('labels.yes') : t('labels.no')} />
                  <DetailItem label={t('fields.weight')} value={displayValue(product.weight)} />
                </DetailGrid>
              </DetailBlock>
            )}

            {product.type === 'variable' && (
              <DetailBlock title={t('sections.variations')}>
                <VariationTable variations={product.variations ?? []} />
              </DetailBlock>
            )}

            {product.type === 'combo' && (
              <DetailBlock title={t('sections.combo')}>
                <ComboTable items={product.combo_items ?? []} />
              </DetailBlock>
            )}

            <DetailBlock title={t('sections.customFields')}>
              {customFieldEntries.length ? (
                <DetailGrid>
                  {customFieldEntries.map(([key, value]) => (
                    <DetailItem
                      key={key}
                      label={customFieldLabels.get(key) ?? key}
                      value={typeof value === 'boolean' ? (value ? t('labels.yes') : t('labels.no')) : displayValue(value)}
                    />
                  ))}
                </DetailGrid>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('labels.noCustomFields')}
                </Typography>
              )}
            </DetailBlock>
          </Stack>
        </Box>
      </Box>
    </Stack>
  )
}

function VariationTable({ variations }: { variations: ProductVariation[] }) {
  const { t } = useTranslation(['products', 'common'])

  if (!variations.length) {
    return <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('messages.noVariations')}</Typography>
  }

  const hasConversion = variations.some((variation) => !!variation.conversion_unit || !!variation.sub_unit_id)
  const hasSubUnitPricing = variations.some(
    (variation) => variation.sub_unit_selling_price != null || variation.sub_unit_purchase_price != null
  )
  const hasMinimumPrice = variations.some((variation) => variation.minimum_selling_price != null)
  const hasProfitMargin = variations.some((variation) => variation.profit_margin != null)

  return (
    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 1280 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: 88 }}>{t('fields.imageFile')}</TableCell>
            <TableCell sx={{ minWidth: 180 }}>{t('fields.name')}</TableCell>
            <TableCell sx={{ minWidth: 150 }}>{t('fields.barcode')}</TableCell>
            {hasConversion && (
              <>
                <TableCell sx={{ minWidth: 150 }}>{t('fields.conversionUnit')}</TableCell>
                <TableCell sx={{ minWidth: 150 }}>{t('fields.conversionFactor')}</TableCell>
              </>
            )}
            <TableCell sx={{ minWidth: 150 }}>{t('fields.sellingPrice')}</TableCell>
            <TableCell sx={{ minWidth: 150 }}>{t('fields.purchasePrice')}</TableCell>
            {hasSubUnitPricing && (
              <>
                <TableCell sx={{ minWidth: 170 }}>{t('fields.subUnitSellingPrice')}</TableCell>
                <TableCell sx={{ minWidth: 170 }}>{t('fields.subUnitPurchasePrice')}</TableCell>
              </>
            )}
            {hasMinimumPrice && <TableCell sx={{ minWidth: 150 }}>{t('fields.minimumSellingPrice')}</TableCell>}
            {hasProfitMargin && <TableCell sx={{ minWidth: 150 }}>{t('fields.profitMargin')}</TableCell>}
            <TableCell sx={{ minWidth: 120 }}>{t('fields.is_active')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {variations.map((variation) => (
            <TableRow key={variation.id ?? variation.name}>
              <TableCell sx={{ minWidth: 88 }}>
                <Avatar
                  variant="rounded"
                  src={variation.image_url ?? ''}
                  sx={{ width: 44, height: 44, borderRadius: 1, bgcolor: 'action.hover', color: 'text.secondary' }}
                >
                  <ImageOutlined fontSize="small" />
                </Avatar>
              </TableCell>
              <TableCell>{variation.name}</TableCell>
              <TableCell>{variation.sku || '-'}</TableCell>
              {hasConversion && (
                <>
                  <TableCell>{variation.conversion_unit ?? '-'}</TableCell>
                  <TableCell>{variation.conversion_factor ?? '-'}</TableCell>
                </>
              )}
              <TableCell>{variation.selling_price ?? '-'}</TableCell>
              <TableCell>{variation.purchase_price ?? '-'}</TableCell>
              {hasSubUnitPricing && (
                <>
                  <TableCell>{variation.sub_unit_selling_price ?? '-'}</TableCell>
                  <TableCell>{variation.sub_unit_purchase_price ?? '-'}</TableCell>
                </>
              )}
              {hasMinimumPrice && <TableCell>{variation.minimum_selling_price ?? '-'}</TableCell>}
              {hasProfitMargin && <TableCell>{variation.profit_margin ?? '-'}</TableCell>}
              <TableCell>
                <Chip
                  size="small"
                  variant="outlined"
                  color={variation.is_active === false ? 'default' : 'success'}
                  label={variation.is_active === false ? t('common:status.inactive') : t('common:status.active')}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function ComboTable({ items }: { items: ComboItem[] }) {
  const { t } = useTranslation(['products', 'common'])

  if (!items.length) {
    return <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('messages.noComboItems')}</Typography>
  }

  return (
    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 760 }}>
        <TableHead>
          <TableRow>
            <TableCell>{t('fields.comboProduct')}</TableCell>
            <TableCell>{t('fields.comboVariation')}</TableCell>
            <TableCell>{t('fields.quantity')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id ?? `${item.child_product_id}-${item.child_variation_id ?? 'none'}`}>
              <TableCell>{item.child_product?.name ?? item.child_product_id}</TableCell>
              <TableCell>{item.child_variation?.name ?? '-'}</TableCell>
              <TableCell>{item.quantity ?? '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
