'use client'

import { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import { usePathname, useSearchParams } from 'next/navigation'

const NAVIGATION_START_EVENT = 'app:navigation-start'
const COMPLETE_DELAY_MS = 180
const SAFETY_TIMEOUT_MS = 12_000

export function startNavigationProgress() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NAVIGATION_START_EVENT))
  }
}

function isInternalNavigation(anchor: HTMLAnchorElement, event: MouseEvent) {
  if (
    event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
    || anchor.target === '_blank'
    || anchor.hasAttribute('download')
  ) {
    return false
  }

  const targetUrl = new URL(anchor.href, window.location.href)
  if (targetUrl.origin !== window.location.origin) return false

  const currentUrl = new URL(window.location.href)
  const targetRoute = `${targetUrl.pathname}${targetUrl.search}`
  const currentRoute = `${currentUrl.pathname}${currentUrl.search}`

  return targetRoute !== currentRoute
}

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const startedRef = useRef(false)
  const timersRef = useRef<number[]>([])

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }

  useEffect(() => {
    const start = () => {
      clearTimers()
      startedRef.current = true
      setVisible(true)
      setProgress(12)

      timersRef.current = [
        window.setTimeout(() => setProgress(48), 120),
        window.setTimeout(() => setProgress(72), 420),
        window.setTimeout(() => setProgress(88), 1_100),
        window.setTimeout(() => setProgress(94), 2_400),
        window.setTimeout(() => {
          startedRef.current = false
          setProgress(100)
          timersRef.current.push(window.setTimeout(() => setVisible(false), COMPLETE_DELAY_MS))
        }, SAFETY_TIMEOUT_MS),
      ]
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest('a')
      if (anchor instanceof HTMLAnchorElement && isInternalNavigation(anchor, event)) {
        start()
      }
    }

    window.addEventListener(NAVIGATION_START_EVENT, start)
    window.addEventListener('popstate', start)
    document.addEventListener('click', handleDocumentClick, true)

    return () => {
      clearTimers()
      window.removeEventListener(NAVIGATION_START_EVENT, start)
      window.removeEventListener('popstate', start)
      document.removeEventListener('click', handleDocumentClick, true)
    }
  }, [])

  useEffect(() => {
    if (!startedRef.current) return

    clearTimers()
    startedRef.current = false
    setProgress(100)
    timersRef.current = [
      window.setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, COMPLETE_DELAY_MS),
    ]
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <Box
      role="progressbar"
      aria-label="Page navigation"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      sx={{
        position: 'fixed',
        inset: '0 0 auto',
        zIndex: (theme) => theme.zIndex.modal + 100,
        height: 3,
        pointerEvents: 'none',
        overflow: 'hidden',
        bgcolor: 'transparent',
      }}
    >
      <Box
        sx={{
          width: `${progress}%`,
          height: '100%',
          bgcolor: 'primary.main',
          boxShadow: (theme) => `0 0 10px ${theme.palette.primary.main}`,
          transition: progress === 100
            ? 'width 140ms ease-out, opacity 180ms ease-out'
            : 'width 360ms cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </Box>
  )
}
