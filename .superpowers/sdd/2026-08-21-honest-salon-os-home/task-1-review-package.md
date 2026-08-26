# Review package — Task 1

No git in this repo. Diff is the added helpers + test file.

## Files
- Modify: src/lib/proof-metrics.ts (guestKey + returningPctFromVisits inserted above computeProofMetrics)
- Create: src/lib/proof-metrics.test.ts

## proof-metrics.ts added functions (lines 29-50)

```
export function guestKey(phone: string | undefined, name: string | undefined): string {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  if (digits.length >= 7) return digits
  return String(name || '').trim().toLowerCase()
}

export function returningPctFromVisits(
  visits: { clientPhone?: string; clientName?: string; status?: string }[],
): number | null {
  const counts = new Map<string, number>()
  for (const v of visits) {
    if (v.status !== 'confirmed' && v.status !== 'completed') continue
    const key = guestKey(v.clientPhone, v.clientName)
    if (!key) continue
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  if (counts.size < 2) return null
  let repeats = 0
  for (const n of counts.values()) if (n >= 2) repeats += 1
  return Math.round((repeats / counts.size) * 100)
}
```

computeProofMetrics() was not changed (still no returningPct fields — Task 2).

## Tests: 5/5 via npx tsx --test (node strip-types failed on calendar-store import)
