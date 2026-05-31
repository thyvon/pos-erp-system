'use client'

import { useParams } from 'next/navigation'
import { PurchaseReturnDetailPage } from '@/features/purchases/PurchaseReturnDetailPage'

export default function Page() {
  const { id } = useParams<{ id: string }>()
  return <PurchaseReturnDetailPage purchaseReturnId={id} />
}
