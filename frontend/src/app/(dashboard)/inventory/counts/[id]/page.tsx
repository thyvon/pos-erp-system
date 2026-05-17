import { StockCountDetailPage } from '@/features/inventory/StockCountDetailPage'

interface StockCountPageProps {
  params: { id: string }
}

export default function StockCountPage({ params }: StockCountPageProps) {
  return <StockCountDetailPage countId={params.id} />
}
