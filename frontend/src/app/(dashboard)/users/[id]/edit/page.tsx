'use client'

import { useParams } from 'next/navigation'
import { UserFormPage } from '@/features/users/UserFormPage'

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>()
  return <UserFormPage userId={id} />
}
