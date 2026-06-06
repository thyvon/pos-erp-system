import { resolveApiBaseUrl } from './axios'

const absoluteUrlPattern = /^(https?:|blob:|data:)/i

export function resolveAssetUrl(url?: string | null) {
  const value = url?.trim()

  if (!value) {
    return undefined
  }

  if (absoluteUrlPattern.test(value)) {
    return value
  }

  const apiBaseUrl = resolveApiBaseUrl().replace(/\/api\/?$/, '')
  const normalizedPath = value.startsWith('/') ? value : `/${value}`

  return `${apiBaseUrl}${normalizedPath}`
}
