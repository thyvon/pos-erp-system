'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Alert, Box, CircularProgress } from '@mui/material'
import { toAppApiError } from '@/api/errors'
import { SaleFormPage } from '@/features/sales/SaleFormPage'
import { useSaleQuery } from '@/features/sales/hooks'

export default function EditSalePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const saleQuery = useSaleQuery(params.id)
  const sale = saleQuery.data

  useEffect(() => {
    if (sale?.type === 'pos_sale') {
      router.replace(`/pos/${sale.id}/edit`)
    }
  }, [router, sale])

  if (saleQuery.isLoading || sale?.type === 'pos_sale') {
    return (
      <Box sx={{ display: 'grid', minHeight: 360, placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (saleQuery.isError) {
    return <Alert severity="error">{toAppApiError(saleQuery.error).message}</Alert>
  }

  return <SaleFormPage saleId={params.id} />
}
