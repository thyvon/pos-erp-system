'use client'

import { useParams } from 'next/navigation'
import { StockTransferDetailPage } from '@/features/inventory/StockTransferDetailPage'

export default function ViewStockTransferPage() {
  const params = useParams<{ id: string }>()

  return <StockTransferDetailPage transferId={params.id} />
}
