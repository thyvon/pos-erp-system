import { ExpenseDetailPage } from '@/features/expenses/ExpenseDetailPage'

export default function Page({ params }: { params: { id: string } }) {
  return <ExpenseDetailPage expenseId={params.id} />
}
