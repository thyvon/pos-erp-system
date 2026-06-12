'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import PageLoader from '@/components/ui/PageLoader'
import { usePurchaseQuery } from '@/features/purchases/hooks'
import type { Purchase, PurchaseItem, PurchaseReceive, PurchaseReceiveItem } from '@/types/purchase'
import { LabelPrintWorkspace } from './LabelPrintWorkspace'
import type { LabelSourceItem } from './types'

interface PurchaseLabelPrintPageProps {
  purchaseId: string
  receiveId?: string | null
}

function productLabel(item: PurchaseItem | undefined) {
  return [item?.product?.name, item?.variation?.name].filter(Boolean).join(' / ') || item?.product_id || '-'
}

function productSku(item: PurchaseItem | undefined) {
  return item?.variation?.sku ?? item?.product?.sku ?? null
}

function sourceItemsFromPurchase(purchase: Purchase, selectedReceiveId: string) {
  const receives = (purchase.receives ?? []).filter((receive) => selectedReceiveId === 'all' || receive.id === selectedReceiveId)
  const purchaseItems = purchase.items ?? []

  return receives.flatMap((receive) => (receive.items ?? []).flatMap((receiveItem) => {
    const purchaseItem = purchaseItems.find((item) => item.id === receiveItem.purchase_item_id)
    return sourceItemsFromReceiveItem(purchase, receive, receiveItem, purchaseItem)
  }))
}

function sourceItemsFromReceiveItem(
  purchase: Purchase,
  receive: PurchaseReceive,
  receiveItem: PurchaseReceiveItem,
  purchaseItem: PurchaseItem | undefined,
): LabelSourceItem[] {
  const serials = receiveItem.serial_numbers ?? []
  const base = {
    receiveId: receive.id,
    receiveNumber: receive.receive_number,
    receivedAt: receive.received_at,
    productName: productLabel(purchaseItem),
    sku: productSku(purchaseItem),
    price: purchaseItem?.unit_cost ?? null,
    lotNumber: receiveItem.lot_number,
    expiryDate: receiveItem.expiry_date,
    purchaseNumber: purchase.purchase_number,
    warehouseName: purchase.warehouse?.name ?? null,
  }

  if (serials.length > 0) {
    return serials.map((serialNumber) => ({
      ...base,
      id: `${receiveItem.id}-${serialNumber}`,
      serialNumber,
      quantity: 1,
    }))
  }

  return [{
    ...base,
    id: receiveItem.id,
    serialNumber: null,
    quantity: Number(receiveItem.quantity ?? 0) || 1,
  }]
}

export function PurchaseLabelPrintPage({ purchaseId, receiveId }: PurchaseLabelPrintPageProps) {
  const { t } = useTranslation(['purchases', 'common'])
  const purchaseQuery = usePurchaseQuery(purchaseId)
  const [selectedReceiveId, setSelectedReceiveId] = useState(receiveId ?? 'all')

  const purchase = purchaseQuery.data
  const receives = purchase?.receives ?? []
  const sourceItems = useMemo(
    () => purchase ? sourceItemsFromPurchase(purchase, selectedReceiveId) : [],
    [purchase, selectedReceiveId],
  )

  if (purchaseQuery.isLoading) {
    return <PageLoader />
  }

  if (purchaseQuery.isError) {
    return <Alert severity="error">{toAppApiError(purchaseQuery.error).message}</Alert>
  }

  if (!purchase) {
    return <Alert severity="warning">{t('common:errors.notFound')}</Alert>
  }

  return (
    <LabelPrintWorkspace
      items={sourceItems}
      title={t('labelPrinting.title')}
      subtitle={`${purchase.purchase_number} · ${purchase.supplier?.name ?? '-'}`}
      backUrl={`/purchases/${purchaseId}`}
      sourceSelector={
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="subtitle2">{t('labelPrinting.source')}</Typography>
              <TextField
                select
                label={t('labelPrinting.receiveRecord')}
                value={selectedReceiveId}
                onChange={(event) => setSelectedReceiveId(event.target.value)}
              >
                <MenuItem value="all">{t('labelPrinting.allReceives')}</MenuItem>
                {receives.map((receive) => (
                  <MenuItem key={receive.id} value={receive.id}>
                    {receive.receive_number}
                  </MenuItem>
                ))}
              </TextField>
              <Alert severity={sourceItems.length === 0 ? 'warning' : 'info'}>
                {sourceItems.length === 0
                  ? t('labelPrinting.noReceivedItems')
                  : t('labelPrinting.previewCount', { count: sourceItems.reduce((acc, item) => acc + item.quantity, 0) })}
              </Alert>
            </Stack>
          </CardContent>
        </Card>
      }
    />
  )
}
