'use client'

import { useParams } from 'next/navigation'
import { SaleDetailPage } from '@/features/sales/SaleDetailPage'

export default function ViewSalePage() {
  const params = useParams<{ id: string }>()

  return <SaleDetailPage saleId={params.id} />
}
