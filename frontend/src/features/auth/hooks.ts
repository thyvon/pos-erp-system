'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from './api'
import { useAuthStore } from '@/stores/authStore'
import type { LoginPayload } from '@/types/auth'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: ({ token, user }) => {
      setAuth(user, token)
      queryClient.setQueryData(authKeys.me, user)
    },
  })
}

export function useSessionQuery(enabled: boolean) {
  const setUser = useAuthStore((state) => state.setUser)
  const logout = useAuthStore((state) => state.logoutLocal)

  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    enabled,
  })

  useEffect(() => {
    if (query.data) setUser(query.data)
  }, [query.data, setUser])

  useEffect(() => {
    if (query.isError) logout()
  }, [logout, query.isError])

  return query
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  const logoutLocal = useAuthStore((state) => state.logoutLocal)

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logoutLocal()
      queryClient.clear()
    },
  })
}
