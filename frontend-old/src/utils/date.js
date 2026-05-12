import { getIntlLocale, i18n } from '@/i18n'

const resolveDate = (value) => {
  if (!value) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const getCurrentIntlLocale = () => getIntlLocale(i18n.global.locale.value)

export const formatHumanDate = (value, fallback = 'Not set') => {
  const date = resolveDate(value)

  if (!date) {
    return fallback
  }

  return new Intl.DateTimeFormat(getCurrentIntlLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export const formatHumanDateTime = (value, fallback = 'Not recorded') => {
  const date = resolveDate(value)

  if (!date) {
    return fallback
  }

  return new Intl.DateTimeFormat(getCurrentIntlLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const formatHumanLongDate = (value, fallback = 'Not set') => {
  const date = resolveDate(value)

  if (!date) {
    return fallback
  }

  return new Intl.DateTimeFormat(getCurrentIntlLocale(), {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}
