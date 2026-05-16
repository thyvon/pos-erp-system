'use client'

import { useRouter } from 'next/navigation'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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
import { useProductQuery } from './hooks'
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

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25, overflowWrap: 'anywhere' }}>
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
        gap: 2,
      }}
    >
      {children}
    </Box>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {children}
        </Stack>
      </CardContent>
    </Card>
  )
}

export function ProductDetailPage({ productId }: ProductDetailPageProps) {
  const router = useRouter()
  const { t } = useTranslation(['products', 'common'])
  const can = useAuthStore((state) => state.can)
  const productQuery = useProductQuery(productId)
  const product = productQuery.data
  const canEdit = can('products.edit')

  if (productQuery.isLoading) {
    return (
      <Card>
        <CardContent>
          <CircularProgress size={24} />
        </CardContent>
      </Card>
    )
  }

  if (productQuery.isError || !product) {
    return <Alert severity="error">{toAppApiError(productQuery.error).message}</Alert>
  }

  const customFieldEntries = customFieldsToEntries(product.custom_fields)

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={2} sx={{ minWidth: 0, alignItems: 'center' }}>
          <Avatar
            variant="rounded"
            src={product.image_url ?? ''}
            sx={{ width: 64, height: 64, borderRadius: 1, bgcolor: 'action.hover', color: 'text.secondary' }}
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

      <Section title={t('sections.general')}>
        <DetailGrid>
          <DetailItem label={t('fields.name')} value={product.name} />
          <DetailItem label={t('fields.sku')} value={product.sku || t('labels.noSku')} />
          <DetailItem label={t('fields.type')} value={t(`types.${product.type}`)} />
          <DetailItem label={t('fields.barcodeType')} value={product.barcode_type} />
          <DetailItem label={t('fields.description')} value={product.description || t('labels.noDescription')} />
          <DetailItem label={t('fields.imageFile')} value={product.image_url ? t('labels.imageAvailable') : '-'} />
        </DetailGrid>
      </Section>

      <Section title={t('sections.catalog')}>
        <DetailGrid>
          <DetailItem label={t('fields.category')} value={product.category?.name ?? '-'} />
          <DetailItem label={t('fields.brand')} value={product.brand?.name ?? '-'} />
          <DetailItem label={t('fields.unit')} value={product.unit?.name ?? '-'} />
          <DetailItem label={t('fields.subUnit')} value={product.sub_unit?.name ?? '-'} />
          <DetailItem label={t('fields.taxRate')} value={product.tax_rate?.name ?? '-'} />
          <DetailItem label={t('fields.taxType')} value={t(`taxTypes.${product.tax_type}`)} />
          <DetailItem label={t('fields.priceGroup')} value={product.price_group?.name ?? '-'} />
          <DetailItem
            label={t('fields.rackLocation')}
            value={product.rack_location ? `${product.rack_location.name} (${product.rack_location.code})` : '-'}
          />
        </DetailGrid>
      </Section>

      <Section title={t('sections.pricing')}>
        <DetailGrid>
          <DetailItem label={t('fields.sellingPrice')} value={product.selling_price ?? '-'} />
          <DetailItem label={t('fields.purchasePrice')} value={product.purchase_price ?? '-'} />
          <DetailItem label={t('fields.subUnitSellingPrice')} value={product.sub_unit_selling_price ?? '-'} />
          <DetailItem label={t('fields.subUnitPurchasePrice')} value={product.sub_unit_purchase_price ?? '-'} />
          <DetailItem label={t('fields.minimumSellingPrice')} value={product.minimum_selling_price ?? '-'} />
          <DetailItem label={t('fields.profitMargin')} value={product.profit_margin ?? '-'} />
        </DetailGrid>
      </Section>

      <Section title={t('sections.stock')}>
        <DetailGrid>
          <DetailItem label={t('fields.stockTracking')} value={t(`stockTracking.${product.stock_tracking}`)} />
          <DetailItem label={t('fields.track_inventory')} value={product.track_inventory ? t('labels.yes') : t('labels.no')} />
          <DetailItem label={t('fields.has_expiry')} value={product.has_expiry ? t('labels.yes') : t('labels.no')} />
          <DetailItem label={t('fields.is_for_selling')} value={product.is_for_selling ? t('labels.yes') : t('labels.no')} />
          <DetailItem label={t('fields.alertQuantity')} value={product.alert_quantity ?? '-'} />
          <DetailItem label={t('fields.maxStockLevel')} value={product.max_stock_level ?? '-'} />
          <DetailItem label={t('fields.weight')} value={product.weight ?? '-'} />
        </DetailGrid>
      </Section>

      {product.type === 'variable' && (
        <Section title={t('sections.variations')}>
          <VariationTable variations={product.variations ?? []} />
        </Section>
      )}

      {product.type === 'combo' && (
        <Section title={t('sections.combo')}>
          <ComboTable items={product.combo_items ?? []} />
        </Section>
      )}

      <Section title={t('sections.customFields')}>
        {customFieldEntries.length ? (
          <DetailGrid>
            {customFieldEntries.map(([key, value]) => (
              <DetailItem
                key={key}
                label={key}
                value={typeof value === 'boolean' ? (value ? t('labels.yes') : t('labels.no')) : displayValue(value)}
              />
            ))}
          </DetailGrid>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('labels.noCustomFields')}
          </Typography>
        )}
      </Section>
    </Stack>
  )
}

function VariationTable({ variations }: { variations: ProductVariation[] }) {
  const { t } = useTranslation(['products', 'common'])

  if (!variations.length) {
    return <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('messages.noVariations')}</Typography>
  }

  return (
    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow>
            <TableCell>{t('fields.name')}</TableCell>
            <TableCell>{t('fields.sku')}</TableCell>
            <TableCell>{t('fields.sellingPrice')}</TableCell>
            <TableCell>{t('fields.purchasePrice')}</TableCell>
            <TableCell>{t('fields.minimumSellingPrice')}</TableCell>
            <TableCell>{t('fields.is_active')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {variations.map((variation) => (
            <TableRow key={variation.id ?? variation.name}>
              <TableCell>{variation.name}</TableCell>
              <TableCell>{variation.sku || '-'}</TableCell>
              <TableCell>{variation.selling_price ?? '-'}</TableCell>
              <TableCell>{variation.purchase_price ?? '-'}</TableCell>
              <TableCell>{variation.minimum_selling_price ?? '-'}</TableCell>
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
