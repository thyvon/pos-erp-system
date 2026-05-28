import { SaleReturnDetailPage } from '@/features/sales/SaleReturnDetailPage'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params

  return <SaleReturnDetailPage saleReturnId={id} />
}
