'use client'

import { useParams } from 'next/navigation'
import { PurchaseFormPage } from '@/features/purchases/PurchaseFormPage'

export default function EditPurchasePage() {
  const params = useParams<{ id: string }>()
  return <PurchaseFormPage purchaseId={params.id} />
}
