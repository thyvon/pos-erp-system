import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth() {
  const { user, token, isAuthenticated, login, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated && !token) {
      router.push('/login')
    }
  }, [isAuthenticated, token, router])

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
  }
}

export function useRequireAuth() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  return isAuthenticated
}