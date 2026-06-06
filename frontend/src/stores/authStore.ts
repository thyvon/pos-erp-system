import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_ENABLED_MODULE_KEYS, type ModuleKey } from '@/core/modules/moduleRegistry'
import { User, Business, AllowedBranch } from '@/types/auth'

interface AuthState {
  user: User | null
  business: Business | null
  token: string | null
  isLoggedIn: boolean
  isLoading: boolean
  hasHydrated: boolean
}

interface AuthActions {
  setAuth: (user: User, token: string, business?: Business | null) => void
  setUser: (user: User) => void
  setBusiness: (business: Business) => void
  logout: () => void
  logoutLocal: () => void
  setLoading: (loading: boolean) => void
  setHasHydrated: (hasHydrated: boolean) => void
  can: (permission: string) => boolean
  hasModule: (moduleKey: ModuleKey) => boolean
  hasRole: (role: string) => boolean
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
  getAllowedBranches: () => AllowedBranch[]
  hasBranchAccess: () => boolean
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  business: null,
  token: null,
  isLoggedIn: false,
  isLoading: false,
  hasHydrated: false,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAuth: (user, token, business) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token)
        }
        set({
          user,
          business: business ?? user.business ?? null,
          token,
          isLoggedIn: true,
          isLoading: false,
        })
      },

      setUser: (user) => set({ user, business: user.business ?? null, isLoggedIn: true }),
      setBusiness: (business) => set((state) => ({
        business,
        user: state.user ? { ...state.user, business } : state.user,
      })),

      logout: () => {
        get().logoutLocal()
      },

      logoutLocal: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
        }
        set({ ...initialState, hasHydrated: true, isLoading: false })
      },

      setLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      can: (permission: string) => {
        const { user } = get()
        if (!user) return false
        if (user.roles.includes('super_admin')) return true
        if (user.roles.includes('admin')) return true
        return user.permissions.includes(permission)
      },

      hasModule: (moduleKey) => {
        const { user } = get()
        if (!user) return false
        if (user.roles.includes('super_admin')) return true

        const enabledModules = user.enabled_modules ?? DEFAULT_ENABLED_MODULE_KEYS

        return enabledModules.includes(moduleKey)
      },

      hasRole: (role: string) => {
        const { user } = get()
        if (!user) return false
        return user.roles.includes(role)
      },

      isAdmin: () => {
        const { user } = get()
        if (!user) return false
        return user.roles.includes('admin') || user.roles.includes('super_admin')
      },

      isSuperAdmin: () => {
        const { user } = get()
        return user?.roles.includes('super_admin') ?? false
      },

      getAllowedBranches: () => {
        const { user } = get()
        return user?.allowed_branches ?? []
      },

      hasBranchAccess: () => {
        const { user } = get()
        if (!user) return false
        return (user.allowed_branches?.length ?? 0) > 0
      },
    }),
    {
      name: 'erp-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        business: state.business,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
        if (state?.token && typeof window !== 'undefined') {
          localStorage.setItem('auth_token', state.token)
        }
      },
    }
  )
)
