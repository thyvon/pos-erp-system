import { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

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

export function toAppApiError(error: unknown): AppApiError {
  if (error instanceof AppApiError) return error

  if (error instanceof AxiosError) {
    const payload = error.response?.data as Partial<ApiError> | undefined
    return new AppApiError(
      payload?.message || error.message || 'Request failed',
      error.response?.status,
      payload?.errors
    )
  }

  if (error instanceof Error) {
    return new AppApiError(error.message)
  }

  return new AppApiError('Unexpected error')
}
