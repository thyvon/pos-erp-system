import dayjs from 'dayjs'
import 'dayjs/locale/km'

export type AppDateFormat = 'Y-m-d' | 'd/m/Y' | 'm/d/Y'
export type AppDateLocale = 'en' | 'km'

export const DEFAULT_APP_DATE_FORMAT: AppDateFormat = 'Y-m-d'

export function resolveAppDateFormat(value: unknown): AppDateFormat {
  return value === 'd/m/Y' || value === 'm/d/Y' || value === 'Y-m-d'
    ? value
    : DEFAULT_APP_DATE_FORMAT
}

export function getAppDateLocale(language?: string | null): AppDateLocale {
  return language?.startsWith('km') ? 'km' : 'en'
}

function getMonthToken(locale: AppDateLocale) {
  return locale === 'km' ? 'MMMM' : 'MMM'
}

export function getAppDateDisplayFormat(dateFormat?: string | null, language?: string | null) {
  const monthToken = getMonthToken(getAppDateLocale(language))

  switch (resolveAppDateFormat(dateFormat)) {
    case 'd/m/Y':
      return `DD ${monthToken} YYYY`
    case 'm/d/Y':
      return `${monthToken} DD YYYY`
    default:
      return `YYYY ${monthToken} DD`
  }
}

export function formatAppDate(value: string | Date | null | undefined, dateFormat?: string | null, language?: string | null) {
  if (!value) return '-'

  const locale = getAppDateLocale(language)
  const date = dayjs(value).locale(locale)
  return date.isValid() ? date.format(getAppDateDisplayFormat(dateFormat, language)) : String(value)
}

export function formatAppDateTime(value: string | Date | null | undefined, dateFormat?: string | null, language?: string | null) {
  if (!value) return '-'

  const locale = getAppDateLocale(language)
  const date = dayjs(value).locale(locale)
  return date.isValid() ? date.format(`${getAppDateDisplayFormat(dateFormat, language)} h:mm A`) : String(value)
}
