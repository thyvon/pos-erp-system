'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { PurchaseReceivePage } from '@/features/purchases/PurchaseReceivePage'

export default function ReceivePurchaseRoutePage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  return <PurchaseReceivePage purchaseId={params.id} receiveId={searchParams.get('receiveId')} />
}
