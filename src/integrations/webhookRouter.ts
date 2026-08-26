/**
 * Routes a Fill the Book campaign into GlowUP's existing SMS/email outbox.
 * Does not blast guests. Owner sends from Campaigns or Ops.
 */
import { loadOpsSettings } from '../lib/ops-settings'
import { queueMessage, type OutboundMessage } from '../lib/notifications-store'

export type RoutedCampaignType = 'last_minute_fill' | 'rebook' | 'winback'

export type RoutedCampaign = {
  id: string
  campaignType: RoutedCampaignType
  targetClientIds: string[]
  suggestedChannel: 'sms' | 'email'
  generatedContent: {
    bodyText: string
    subject?: string
  }
  scheduledTime: Date | string
}

export type RouteTarget = {
  name: string
  phone?: string
  email?: string
}

export type RouteResult = {
  campaignId: string
  salonId: string
  queued: OutboundMessage[]
  skipped: string[]
}

export async function routeCampaignToExternalApps(
  campaign: RoutedCampaign,
  salonId: string,
  target?: RouteTarget,
): Promise<RouteResult> {
  const queued: OutboundMessage[] = []
  const skipped: string[] = []
  const settings = loadOpsSettings()
  const studio = settings.studioName || 'Studio'
  const body = campaign.generatedContent.bodyText.trim()
  const subject =
    campaign.generatedContent.subject?.trim() || `${studio}: a chair opened`

  if (!body) {
    return { campaignId: campaign.id, salonId, queued, skipped: ['empty copy'] }
  }

  const channel = campaign.suggestedChannel
  if (channel === 'sms') {
    const to = target?.phone?.trim()
    if (!to) skipped.push('no phone')
    else {
      queued.push(
        queueMessage({
          channel: 'sms',
          to,
          subject,
          body: body.slice(0, 160),
          kind: 'custom',
        }),
      )
    }
  } else {
    const to = target?.email?.trim()
    if (!to) skipped.push('no email')
    else {
      queued.push(
        queueMessage({
          channel: 'email',
          to,
          subject,
          body,
          kind: 'custom',
        }),
      )
    }
  }

  return { campaignId: campaign.id, salonId, queued, skipped }
}
