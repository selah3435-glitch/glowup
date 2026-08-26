/**
 * Fill-the-chair campaign writer. Same job as the pasted generateSalonCampaign
 * helper — wired to the salon copywriter, not a generic marketing LLM.
 * Do not invent discounts. Offer is only used if the owner passed a real one.
 */
import type { CopyCampaign, CopyPack } from './copywriter'
import { fallbackCopyPack } from './copywriter'
import { generateCopyPack } from '../lib/copywriter-client'
import { loadSalonContext } from '../lib/demo-salon'
import { formatBookGapExtra, snapshotBookGaps, type HighValueClient } from '../lib/book-gaps'

export type SalonCampaignProposal = {
  suggestedChannel: 'sms' | 'email'
  bodyText: string
  subject: string
  pack: CopyPack
  campaign: CopyCampaign
  fallback?: boolean
  error?: string
}

function looksLikeInventedDiscount(offer?: string): boolean {
  if (!offer) return true
  return /^\s*\d+\s*%\s*$/.test(offer)
}

export async function generateSalonCampaign(
  clientName: string,
  lastServiceType: string,
  offer?: string,
  extra?: { kind?: HighValueClient['kind']; bookExtra?: string },
): Promise<SalonCampaignProposal> {
  const salon = loadSalonContext()
  const campaign: CopyCampaign = extra?.kind || 'slow'
  const snap = snapshotBookGaps()
  const bookExtra = extra?.bookExtra || formatBookGapExtra(campaign, snap)
  const offerLine =
    offer && !looksLikeInventedDiscount(offer) ? `Owner offer to mention: ${offer}` : ''

  const req = {
    salonName: salon.name,
    city: salon.city,
    brandTone: salon.brandTone,
    service: lastServiceType,
    campaign,
    extra: [
      `Write for ${clientName} (first name ok on SMS/email).`,
      `Last service: ${lastServiceType}.`,
      'No required discount. Do not invent a percent off.',
      offerLine,
      bookExtra,
    ]
      .filter(Boolean)
      .join('\n'),
  }

  let pack: CopyPack
  let fallback = false
  let error: string | undefined
  try {
    const result = await generateCopyPack(req)
    pack = result.pack
    fallback = Boolean(result.fallback)
    error = result.error
  } catch {
    pack = fallbackCopyPack(req)
    fallback = true
    error = 'copywriter request failed'
  }

  const suggestedChannel: 'sms' | 'email' = pack.sms.length <= 160 ? 'sms' : 'email'
  return {
    suggestedChannel,
    bodyText: suggestedChannel === 'sms' ? pack.sms : pack.email.body,
    subject: pack.email.subject,
    pack,
    campaign,
    fallback,
    error,
  }
}
