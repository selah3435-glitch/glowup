import {
  fallbackCopyPack,
  parseCopyPack,
  type CopyPack,
  type CopywriterRequest,
} from '../agents/copywriter'
import { generateCopyPackServer } from './copywriter-server'

const ENDPOINTS = ['/api/agents/copywriter', '/.netlify/functions/copywriter'] as const

export type CopywriterResponse = {
  pack: CopyPack
  fallback?: boolean
  error?: string
}

export async function generateCopyPack(req: CopywriterRequest): Promise<CopywriterResponse> {
  try {
    const server = await generateCopyPackServer({ data: req })
    if (server.pack) {
      return { pack: server.pack, fallback: server.fallback, error: server.error }
    }
  } catch {
    // fall through to HTTP functions
  }

  for (const url of ENDPOINTS) {
    try {
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), 45000)
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        signal: controller.signal,
      })
      window.clearTimeout(timer)
      const text = await res.text()
      if (/<!DOCTYPE|<html[\s>]/i.test(text.slice(0, 200))) continue
      const data = JSON.parse(text) as {
        pack?: CopyPack
        raw?: string
        fallback?: boolean
        error?: string
      }
      const pack = data.pack || (data.raw ? parseCopyPack(data.raw) : null)
      if (pack) return { pack, fallback: data.fallback, error: data.error }
    } catch {
      // try next endpoint
    }
  }
  return { pack: fallbackCopyPack(req), fallback: true, error: 'offline' }
}
