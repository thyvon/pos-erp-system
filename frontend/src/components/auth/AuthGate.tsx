'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useSessionQuery } from '@/features/auth/hooks'
import PageLoader from '@/components/ui/PageLoader'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const token = useAuthStore((state) => state.token)
  const hasBranchAccess = useAuthStore((state) => state.hasBranchAccess)
  const session = useSessionQuery(hasHydrated && isLoggedIn && !!token)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isLoggedIn || !token) {
      router.replace('/login')
      return
    }
    if (!session.isLoading && !hasBranchAccess() && pathname !== '/no-branch-access/') {
      router.replace('/no-branch-access')
    }
  }, [hasBranchAccess, hasHydrated, isLoggedIn, pathname, router, session.isLoading, token])

  if (!hasHydrated || session.isLoading) return <PageLoader />
  if (!isLoggedIn || !token) return null

  return <>{children}</>
}
