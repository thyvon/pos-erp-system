import { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

type ApiErrorPayload = Partial<ApiError> & {
  detail?: string
  error?: string
}

export class AppApiError extends Error {
  status?: number
  fieldErrors?: Record<string, string[]>

  constructor(message: string, status?: number, fieldErrors?: Record<string, string[]>) {
    super(message)
    this.name = 'AppApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

function extractFieldErrors(errors: unknown) {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return undefined

  return Object.entries(errors).reduce<Record<string, string[]>>((nextErrors, [field, messages]) => {
    if (Array.isArray(messages)) {
      nextErrors[field] = messages.map((message) => String(message))
      return nextErrors
    }

    if (messages !== null && messages !== undefined) {
      nextErrors[field] = [String(messages)]
    }

    return nextErrors
  }, {})
}

function messageFromResponseData(data: unknown) {
  if (typeof data === 'string') {
    return data.trim() || undefined
  }

  if (!data || typeof data !== 'object') return undefined

  const payload = data as ApiErrorPayload
  return payload.message || payload.detail || payload.error
}

function networkFallbackMessage(error: AxiosError) {
  if (error.code === 'ECONNABORTED') {
    return 'The server took too long to respond. Please try again.'
  }

  if (error.message === 'Network Error') {
    return 'Could not read the server response. Check that the API URL, HTTPS, and CORS allowed origins are configured for this domain.'
  }

  return error.message || 'Could not reach the server.'
}

export function toAppApiError(error: unknown): AppApiError {
  if (error instanceof AppApiError) return error

  if (error instanceof AxiosError) {
    const responseMessage = messageFromResponseData(error.response?.data)
    const statusText = error.response?.statusText

    return new AppApiError(
      responseMessage || statusText || networkFallbackMessage(error),
      error.response?.status,
      extractFieldErrors((error.response?.data as Partial<ApiError> | undefined)?.errors)
    )
  }

  if (error instanceof Error) {
    return new AppApiError(error.message)
  }

  return new AppApiError('Unexpected error')
}
