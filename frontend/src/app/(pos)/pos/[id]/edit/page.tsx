'use client'

import { useParams } from 'next/navigation'
import { PosFormPage } from '@/features/sales/PosFormPage'

export default function EditPosSalePage() {
  const params = useParams<{ id: string }>()

  return <PosFormPage saleId={params.id} />
}
