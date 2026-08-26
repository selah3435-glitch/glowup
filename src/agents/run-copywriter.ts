import {
  buildCopywriterUserPrompt,
  copywriterSystemPrompt,
  fallbackCopyPack,
  parseCopyPack,
  type CopyPack,
  type CopywriterRequest,
} from './copywriter'

export type CopywriterRun = {
  pack: CopyPack
  fallback: boolean
  error?: string
  detail?: string
  model?: string
  agent: 'copywriter'
}

function normalizeRequest(body: CopywriterRequest): CopywriterRequest {
  return {
    salonName: (body.salonName || 'the salon').trim(),
    city: body.city?.trim(),
    brandTone: body.brandTone?.trim(),
    service: body.service?.trim(),
    campaign: body.campaign,
    extra: body.extra?.trim(),
  }
}

export async function runCopywriterRequest(body: CopywriterRequest): Promise<CopywriterRun> {
  const req = normalizeRequest(body)
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) {
    return { pack: fallbackCopyPack(req), fallback: true, error: 'XAI_API_KEY not configured', agent: 'copywriter' }
  }

  const model = process.env.XAI_CHAT_MODEL || 'grok-3-latest'
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: copywriterSystemPrompt(req.campaign) },
          { role: 'user', content: buildCopywriterUserPrompt(req) },
        ],
      }),
    })
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 400)
      return {
        pack: fallbackCopyPack(req),
        fallback: true,
        error: `xAI ${res.status}`,
        detail,
        model,
        agent: 'copywriter',
      }
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const raw = data.choices?.[0]?.message?.content?.trim() || ''
    const parsed = parseCopyPack(raw)
    return {
      pack: parsed || fallbackCopyPack(req),
      fallback: !parsed,
      model,
      agent: 'copywriter',
    }
  } catch (e) {
    return {
      pack: fallbackCopyPack(req),
      fallback: true,
      error: e instanceof Error ? e.message : 'copywriter failed',
      agent: 'copywriter',
    }
  }
}
