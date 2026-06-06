export const MODULE_KEYS = [
  'core',
  'contacts',
  'catalog',
  'inventory',
  'accounting',
  'sales',
  'purchases',
  'expenses',
  'hrm',
  'reports',
] as const

export type ModuleKey = typeof MODULE_KEYS[number]

export const DEFAULT_ENABLED_MODULE_KEYS: ModuleKey[] = [
  'core',
  'contacts',
  'catalog',
  'inventory',
  'accounting',
  'sales',
  'purchases',
  'expenses',
]

export function isModuleKey(value: string): value is ModuleKey {
  return MODULE_KEYS.includes(value as ModuleKey)
}
