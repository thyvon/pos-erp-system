import { StockCountDetailPage } from '@/features/inventory/StockCountDetailPage'

interface StockCountPageProps {
  params: Promise<{ id: string }>
}

export default async function StockCountPage({ params }: StockCountPageProps) {
  const { id } = await params

  return <StockCountDetailPage countId={id} />
}
