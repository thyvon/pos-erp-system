export type SettingValue = string | number | boolean | null | Record<string, unknown> | unknown[]

export type SettingsGroupKey =
  | 'business_profile'
  | 'general'
  | 'invoice'
  | 'label_printing'
  | 'pos'
  | 'stock'
  | 'sales'
  | 'purchases'
  | 'notifications'
  | 'email'
  | 'sms'
  | 'loyalty'
  | 'system'

export type SettingsGroupValues = Record<string, SettingValue>

export interface SettingsFieldOption {
  value: string | number | boolean
  label: string
}

export interface SettingsFieldDefinition {
  key: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea'
  options?: SettingsFieldOption[]
}

export interface SettingsGroupDefinition {
  key: SettingsGroupKey
  fields: SettingsFieldDefinition[]
}
