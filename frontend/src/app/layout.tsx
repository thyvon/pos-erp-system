import type { Metadata } from 'next'
import '@fontsource/public-sans/400.css'
import '@fontsource/public-sans/500.css'
import '@fontsource/public-sans/600.css'
import '@fontsource/public-sans/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/600.css'
import '@fontsource/dm-sans/700.css'
import '@fontsource/nunito-sans/400.css'
import '@fontsource/nunito-sans/500.css'
import '@fontsource/nunito-sans/600.css'
import '@fontsource/nunito-sans/700.css'
import '@fontsource/kantumruy-pro/khmer-400.css'
import '@fontsource/kantumruy-pro/khmer-500.css'
import '@fontsource/kantumruy-pro/khmer-600.css'
import '@fontsource/kantumruy-pro/khmer-700.css'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'ERP System',
  description: 'Modern ERP frontend for sales, inventory, accounting, and operations.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
