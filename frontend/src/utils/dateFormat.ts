import dayjs from 'dayjs'
import 'dayjs/locale/km'

export type AppDateLocale = 'en' | 'km'

export function getAppDateLocale(language: string): AppDateLocale {
  return language.startsWith('km') ? 'km' : 'en'
}

export function getAppDateDisplayFormat(locale: AppDateLocale) {
  return locale === 'km' ? 'D MMMM YYYY' : 'MMMM D, YYYY'
}

export function formatAppDate(value: string | null | undefined, locale: AppDateLocale) {
  if (!value) return '-'

  const date = dayjs(value).locale(locale)
  return date.isValid() ? date.format(getAppDateDisplayFormat(locale)) : value
}

export function formatAppDateTime(value: string | null | undefined, locale: AppDateLocale) {
  if (!value) return '-'

  const date = dayjs(value).locale(locale)
  return date.isValid() ? date.format(`${getAppDateDisplayFormat(locale)} h:mm A`) : value
}
