export function formatMoney(value: number | string | null | undefined, formatter: Intl.NumberFormat) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? formatter.format(numeric) : '-'
}
