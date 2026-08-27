/** Public $ amounts from scraped HTML. Never invent a price. */

const SERVICE =
  /cut|color|balayage|blowout|highlight|facial|mani|pedi|gel|gloss|keratin|extension|brow|lash|wax|massage|trim|style|foil|root|bleach|toner|silk|press|set|fill/i

export function extractPublicPrices(html: string): string[] {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80_000)

  const found: string[] = []
  const seen = new Set<string>()
  const re =
    /.{0,40}\$\s?\d{1,4}(?:[.,]\d{2})?(?:\s*(?:–|-|to|—)\s*\$?\s?\d{1,4}(?:[.,]\d{2})?)?.{0,28}/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) && found.length < 16) {
    const snippet = m[0].trim().replace(/\s+/g, ' ')
    const amount = snippet.match(/\$\s?(\d{1,4})/)
    const n = amount ? Number(amount[1]) : 0
    if (n < 10 && !/from|starting/i.test(snippet)) continue
    if (n > 2500) continue
    const key = snippet.toLowerCase().slice(0, 90)
    if (seen.has(key)) continue
    seen.add(key)
    found.push(snippet.slice(0, 140))
  }
  const withService = found.filter((s) => SERVICE.test(s))
  return (withService.length ? withService : found).slice(0, 8)
}

export function isOwnSalon(title: string, ownName: string): boolean {
  const a = title.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const b = ownName.toLowerCase().replace(/[^a-z0-9]+/g, '')
  if (!a || !b || b.length < 4) return false
  return a.includes(b) || b.includes(a)
}
