'use client'

import { useParams } from 'next/navigation'
import { SaleFormPage } from '@/features/sales/SaleFormPage'

export default function EditSalePage() {
  const params = useParams<{ id: string }>()

  return <SaleFormPage saleId={params.id} />
}
