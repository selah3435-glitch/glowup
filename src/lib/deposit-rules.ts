/** Deposit amount for one appointment. No card reader and no POS — a rule the desk can explain. */

export type DepositRule = {
  depositAmount: string
  highTicketServices: string
  highTicketDeposit: string
  cancelWindowHours: string
}

export function parseMoney(raw: string): number | null {
  const n = Number(String(raw).replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100) / 100
}

export function formatMoney(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
}

/** High-ticket names (comma-separated) use the higher deposit. Everything else uses the default. */
export function resolveDepositAmount(service: string, rule: DepositRule): string {
  const fallback = parseMoney(rule.depositAmount)
  const premium = parseMoney(rule.highTicketDeposit)
  const serviceName = service.trim().toLowerCase()
  const names = rule.highTicketServices
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 1)
  const matches = serviceName.length > 0 && names.some((name) => serviceName.includes(name) || name.includes(serviceName))
  if (matches && premium != null) return formatMoney(premium)
  if (fallback != null) return formatMoney(fallback)
  return rule.depositAmount.trim() || '0'
}

export function cancelPolicyLine(hoursRaw: string): string {
  const hours = Math.round(Number(String(hoursRaw).replace(/[^0-9.]/g, '')))
  if (!Number.isFinite(hours) || hours <= 0) return ''
  const unit = hours === 1 ? 'hour' : 'hours'
  return `Cancel inside ${hours} ${unit} and the studio keeps the deposit.`
}
