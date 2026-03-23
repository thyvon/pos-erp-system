import { createI18n } from 'vue-i18n'
import en from './messages/en'
import km from './messages/km'

export const LOCALE_KEY = 'erp_locale'
export const SUPPORTED_LOCALES = ['en', 'km']

const INTL_LOCALE_MAP = {
  en: 'en-US',
  km: 'km-KH',
}

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('auth_user') || 'null')
  } catch {
    return null
  }
}

export const normalizeLocale = (value) => {
  if (!value || typeof value !== 'string') {
    return null
  }

  const normalized = value.toLowerCase().slice(0, 2)

  return SUPPORTED_LOCALES.includes(normalized) ? normalized : null
}

export const resolveLocalePreference = (user = null) => {
  return (
    normalizeLocale(user?.locale) ||
    normalizeLocale(user?.preferences?.locale) ||
    normalizeLocale(user?.business?.locale) ||
    normalizeLocale(localStorage.getItem(LOCALE_KEY)) ||
    normalizeLocale(navigator.language) ||
    'en'
  )
}

export const getIntlLocale = (locale) => INTL_LOCALE_MAP[normalizeLocale(locale) || 'en'] || 'en-US'

const initialLocale = resolveLocalePreference(readStoredUser())

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    km,
  },
})

export const applyLocale = (locale) => {
  const resolved = normalizeLocale(locale) || 'en'

  i18n.global.locale.value = resolved
  localStorage.setItem(LOCALE_KEY, resolved)
  document.documentElement.lang = getIntlLocale(resolved)

  return resolved
}

applyLocale(initialLocale)
