'use client'

import { useParams } from 'next/navigation'
import { PurchaseDetailPage } from '@/features/purchases/PurchaseDetailPage'

export default function ViewPurchasePage() {
  const params = useParams<{ id: string }>()
  return <PurchaseDetailPage purchaseId={params.id} />
}
