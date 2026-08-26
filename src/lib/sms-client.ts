/** Send SMS via /api/sms (Twilio) with native fallback */

export async function sendSms(input: {
  to: string
  body: string
  kind?: string
}): Promise<{ ok: boolean; fallback?: 'native'; error?: string; sid?: string }> {
  try {
    const res = await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const data = (await res.json()) as {
      ok?: boolean
      fallback?: string
      error?: string
      sid?: string
      message?: string
    }
    if (data.ok) return { ok: true, sid: data.sid }
    return {
      ok: false,
      fallback: data.fallback === 'native' ? 'native' : undefined,
      error: data.error || data.message || 'send failed',
    }
  } catch (e) {
    return { ok: false, fallback: 'native', error: e instanceof Error ? e.message : 'network' }
  }
}
