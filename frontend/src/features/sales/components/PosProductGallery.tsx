'use client'

import {
  Autocomplete,
  Box,
  CardActionArea,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Search } from '@/components/ui/icons'
import type { Brand } from '@/types/brand'
import type { Category } from '@/types/category'
import type { Product } from '@/types/product'
import { toNumber } from '../formHelpers'

export type PosProductTab = 'featured' | 'category' | 'brand'

interface PosProductGalleryProps {
  productTab: PosProductTab
  onProductTabChange: (value: PosProductTab) => void
  categoryId: string
  onCategoryIdChange: (value: string) => void
  brandId: string
  onBrandIdChange: (value: string) => void
  search: string
  onSearchChange: (value: string) => void
  categories: Category[]
  brands: Brand[]
  products: Product[]
  categoriesLoading: boolean
  brandsLoading: boolean
  productsLoading: boolean
  warehouseId: string
  isSaving: boolean
  isAddingTileProduct: boolean
  currencyFormatter: Intl.NumberFormat
  onAddProduct: (product: Product) => void | Promise<void>
}

function categoryLabel(category: Category) {
  return category.name
}

function brandLabel(brand: Brand) {
  return brand.name
}

function productPrice(product: Product) {
  if (product.selling_price !== null && product.selling_price !== undefined) return toNumber(product.selling_price)
  return toNumber(product.variations?.[0]?.selling_price)
}

export function PosProductGallery({
  productTab,
  onProductTabChange,
  categoryId,
  onCategoryIdChange,
  brandId,
  onBrandIdChange,
  search,
  onSearchChange,
  categories,
  brands,
  products,
  categoriesLoading,
  brandsLoading,
  productsLoading,
  warehouseId,
  isSaving,
  isAddingTileProduct,
  currencyFormatter,
  onAddProduct,
}: PosProductGalleryProps) {
  const { t } = useTranslation(['sales'])

  return (
    <Stack spacing={2}>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5, bgcolor: 'background.paper' }}>
        <Stack spacing={1.5}>
          <ToggleButtonGroup
            fullWidth
            exclusive
            size="small"
            value={productTab}
            onChange={(_, nextTab: PosProductTab | null) => {
              if (!nextTab) return
              onProductTabChange(nextTab)
            }}
          >
            <ToggleButton value="featured">{t('pos.productTabs.featured')}</ToggleButton>
            <ToggleButton value="category">{t('pos.productTabs.category')}</ToggleButton>
            <ToggleButton value="brand">{t('pos.productTabs.brand')}</ToggleButton>
          </ToggleButtonGroup>

          {productTab === 'category' && (
            <Autocomplete
              options={categories}
              value={categories.find((category) => category.id === categoryId) ?? null}
              loading={categoriesLoading}
              getOptionLabel={categoryLabel}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, category) => onCategoryIdChange(category?.id ?? '')}
              renderInput={(params) => <TextField {...params} label={t('pos.filters.category')} />}
            />
          )}

          {productTab === 'brand' && (
            <Autocomplete
              options={brands}
              value={brands.find((brand) => brand.id === brandId) ?? null}
              loading={brandsLoading}
              getOptionLabel={brandLabel}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, brand) => onBrandIdChange(brand?.id ?? '')}
              renderInput={(params) => <TextField {...params} label={t('pos.filters.brand')} />}
            />
          )}

          <TextField
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('pos.filters.productSearch')}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
              gap: 1,
              maxHeight: { xs: 'calc(100vh - 180px)', lg: 'calc(100vh - 390px)' },
              overflowY: 'auto',
              pr: 0.5,
            }}
          >
            {productsLoading && (
              <Box sx={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            {!productsLoading && products.length === 0 && (
              <Box sx={{ gridColumn: '1 / -1', py: 4, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('pos.noProducts')}</Typography>
              </Box>
            )}
            {products.map((product) => {
              const price = productPrice(product)

              return (
                <CardActionArea
                  key={product.id}
                  disabled={!warehouseId || isSaving || isAddingTileProduct || !product.is_for_selling}
                  onClick={() => void onAddProduct(product)}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    aspectRatio: '1 / 1',
                    minHeight: 178,
                    display: 'flex',
                    alignItems: 'stretch',
                  }}
                >
                  <Stack
                    spacing={0.75}
                    sx={{
                      width: '100%',
                      height: '100%',
                      p: 1,
                      alignItems: 'center',
                      textAlign: 'center',
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        flex: '1 1 auto',
                        minHeight: 96,
                        borderRadius: 1,
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                        backgroundImage: product.image_url ? `url(${product.image_url})` : 'none',
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 700, width: '100%' }} noWrap title={product.name}>
                      {product.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                      {product.sku || product.variations?.[0]?.sku || '-'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                      {currencyFormatter.format(price)}
                    </Typography>
                  </Stack>
                </CardActionArea>
              )
            })}
          </Box>
        </Stack>
      </Box>
    </Stack>
  )
}
