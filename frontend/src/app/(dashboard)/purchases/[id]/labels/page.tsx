'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { PurchaseLabelPrintPage } from '@/features/labels/PurchaseLabelPrintPage'

export default function PurchaseLabelsRoutePage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()

  return <PurchaseLabelPrintPage purchaseId={params.id} receiveId={searchParams.get('receiveId')} />
}
