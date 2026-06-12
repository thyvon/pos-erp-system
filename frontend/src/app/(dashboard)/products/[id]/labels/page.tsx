'use client'

import { useParams } from 'next/navigation'
import { ProductLabelPrintPage } from '@/features/labels/ProductLabelPrintPage'

export default function ProductLabelsRoutePage() {
  const params = useParams<{ id: string }>()

  return <ProductLabelPrintPage productId={params.id} />
}
