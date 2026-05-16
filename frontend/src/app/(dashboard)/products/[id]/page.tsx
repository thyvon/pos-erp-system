'use client'

import { useParams } from 'next/navigation'
import { ProductDetailPage } from '@/features/products/ProductDetailPage'

export default function ViewProductPage() {
  const params = useParams<{ id: string }>()

  return <ProductDetailPage productId={params.id} />
}
