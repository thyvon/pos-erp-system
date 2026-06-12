'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  CardContent,
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
import PageLoader from '@/components/ui/PageLoader'
import { useProductQuery } from '@/features/products/hooks'
import { LabelPrintWorkspace } from './LabelPrintWorkspace'
import type { LabelSourceItem } from './types'

interface ProductLabelPrintPageProps {
  productId: string
}

export function ProductLabelPrintPage({ productId }: ProductLabelPrintPageProps) {
  const { t } = useTranslation(['products', 'common'])
  const productQuery = useProductQuery(productId)
  const product = productQuery.data

  const variationsList = useMemo(() => {
    if (!product) return []
    if (product.type === 'variable' && product.variations && product.variations.length > 0) {
      return product.variations
    }
    return [
      {
        id: product.id,
        name: '',
        sku: product.sku,
        selling_price: product.selling_price,
      },
    ]
  }, [product])

  // Map of variation/product ID -> print quantity (custom overrides)
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const handleQtyChange = (id: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0)
    setQuantities((prev) => ({ ...prev, [id]: num }))
  }

  const setAllQuantities = (qty: number) => {
    const updated: Record<string, number> = {}
    variationsList.forEach((v) => {
      updated[v.id || product?.id || ''] = qty
    })
    setQuantities(updated)
  }

  const sourceItems = useMemo<LabelSourceItem[]>(() => {
    if (!product) return []
    return variationsList
      .map((v) => {
        const id = v.id || product.id
        const qty = id in quantities ? quantities[id] : 5
        const isProduct = id === product.id && product.type !== 'variable'
        return {
          id,
          productName: isProduct
            ? product.name
            : [product.name, v.name].filter(Boolean).join(' / '),
          sku: v.sku || product.sku,
          price: v.selling_price || product.selling_price,
          quantity: qty,
          receiveId: '',
          receiveNumber: '',
          receivedAt: null,
          purchaseNumber: '',
          warehouseName: null,
          lotNumber: null,
          expiryDate: null,
          serialNumber: null,
        }
      })
      .filter((item) => item.quantity > 0)
  }, [product, variationsList, quantities])

  const totalLabels = useMemo(() => {
    return sourceItems.reduce((acc, item) => acc + item.quantity, 0)
  }, [sourceItems])

  if (productQuery.isLoading) {
    return <PageLoader />
  }

  if (productQuery.isError) {
    return <Alert severity="error">{toAppApiError(productQuery.error).message}</Alert>
  }

  if (!product) {
    return <Alert severity="warning">{t('common:errors.notFound')}</Alert>
  }

  return (
    <LabelPrintWorkspace
      items={sourceItems}
      title={t('labelPrinting.title')}
      subtitle={product.name}
      backUrl={`/products/${productId}`}
      sourceSelector={
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="subtitle2">{t('labelPrinting.source')}</Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Button size="small" variant="outlined" onClick={() => setAllQuantities(1)}>
                  {t('labelPrinting.setAll')} 1
                </Button>
                <Button size="small" variant="outlined" onClick={() => setAllQuantities(5)}>
                  {t('labelPrinting.setAll')} 5
                </Button>
                <Button size="small" variant="outlined" onClick={() => setAllQuantities(0)}>
                  {t('labelPrinting.reset')}
                </Button>
              </Stack>

              <TableContainer sx={{ maxHeight: 220, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('fields.name')}</TableCell>
                      <TableCell>{t('fields.barcode')}</TableCell>
                      <TableCell align="right" sx={{ width: 100 }}>
                        {t('labelPrinting.qty')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {variationsList.map((v) => {
                      const id = v.id || product.id
                      const qty = id in quantities ? quantities[id] : 5
                      const displayName = v.name ? v.name : t('types.single')
                      return (
                        <TableRow key={id}>
                          <TableCell>{displayName}</TableCell>
                          <TableCell>{v.sku || '-'}</TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={qty}
                              onChange={(e) => handleQtyChange(id, e.target.value)}
                              slotProps={{ htmlInput: { min: 0, style: { textAlign: 'right', padding: '4px 8px' } } }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Alert severity={totalLabels === 0 ? 'warning' : 'info'}>
                {totalLabels === 0
                  ? t('labelPrinting.noVariations')
                  : t('labelPrinting.printCount', { count: totalLabels })}
              </Alert>
            </Stack>
          </CardContent>
        </Card>
      }
    />
  )
}
