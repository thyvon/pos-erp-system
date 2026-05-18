import { StockCountEntryPage } from '@/features/inventory/StockCountEntryPage'

interface StockCountEntriesPageProps {
  params: Promise<{ id: string }>
}

export default async function StockCountEntriesPage({ params }: StockCountEntriesPageProps) {
  const { id } = await params

  return <StockCountEntryPage countId={id} />
}
