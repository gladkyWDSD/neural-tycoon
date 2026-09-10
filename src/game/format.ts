/** Compact money for headline numbers, e.g. 1_240_000_000 -> "$1.24B". */
export function formatMoney(value: number): string {
  const n = Math.round(value)
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`
  if (abs >= 1e4) return `${sign}$${Math.round(abs / 1e3)}k`
  return `${sign}$${abs.toLocaleString()}`
}
