'use client'

import { useParams } from 'next/navigation'
import { StockTransferFormPage } from '@/features/inventory/StockTransferFormPage'

export default function EditStockTransferPage() {
  const params = useParams<{ id: string }>()

  return <StockTransferFormPage transferId={params.id} />
}
