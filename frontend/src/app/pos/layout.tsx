'use client'

import { AuthGate } from '@/components/auth/AuthGate'
import LayoutSettings from '@/components/layout/LayoutSettings'

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <LayoutSettings />
      {children}
    </AuthGate>
  )
}
