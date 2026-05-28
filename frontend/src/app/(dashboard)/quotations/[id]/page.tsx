import { QuotationDetailPage } from '@/features/sales/QuotationDetailPage'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params

  return <QuotationDetailPage quotationId={id} />
}
