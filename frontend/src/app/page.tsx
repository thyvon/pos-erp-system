'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import PageLoader from '@/components/ui/PageLoader'

export default function HomePage() {
  const { isLoggedIn, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (isLoggedIn) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [isLoggedIn, isLoading, router])

  return <PageLoader />
}
