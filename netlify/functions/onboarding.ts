import { getUser } from '@netlify/identity'
import type { Config } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { salons } from '../../db/schema.js'

interface OnboardingInput {
  name?: string
  businessType?: string
  teamSize?: string
  city?: string
  phone?: string
  services?: string[]
  brandTone?: string
  externalBookingUrl?: string
  partnerOrg?: string
}

export default async function handler(request: Request) {
  const user = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (request.method === 'GET') {
    const [salon] = await db.select().from(salons).where(eq(salons.ownerId, user.id)).limit(1)
    return Response.json(salon ?? {})
  }

  if (request.method === 'POST') {
    const input = await request.json() as OnboardingInput
    if (!input.name?.trim() || !input.city?.trim() || !input.businessType || !input.teamSize || !input.brandTone) {
      return Response.json({ error: 'Missing required studio details' }, { status: 400 })
    }

    const values = {
      ownerId: user.id,
      name: input.name.trim(),
      businessType: input.businessType,
      teamSize: input.teamSize,
      city: input.city.trim(),
      phone: input.phone?.trim() ?? '',
      services: input.services ?? [],
      brandTone: input.brandTone,
      externalBookingUrl: input.externalBookingUrl?.trim() ?? '',
      partnerOrg: input.partnerOrg?.trim() ?? '',
      updatedAt: new Date(),
    }

    const [salon] = await db.insert(salons).values(values).onConflictDoUpdate({
      target: salons.ownerId,
      set: values,
    }).returning()

    return Response.json(salon, { status: 201 })
  }

  return new Response('Method not allowed', { status: 405 })
}

export const config: Config = { path: '/api/onboarding' }
