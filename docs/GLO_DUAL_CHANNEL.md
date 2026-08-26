# Glo dual channel — phone + website chat

Both paths share the same agent identity and business rules.

| Channel | Runtime | Endpoint | Key env |
|---------|---------|----------|---------|
| **Website chat** | Netlify function | `POST /api/glo/chat` | `XAI_API_KEY` on Netlify |
| **Phone** | Always-on Node | `POST /webhooks/xai/realtime` | `XAI_API_KEY` + tunnel/host |
| **Unified local** | `npm run glo:server` | chat + phone on `:8787` | same |

## IDs (locked)

- **Phone:** `+19714761615` · +1 (971) 476-1615  
- **xAI agent:** `00929ede-1eb1-4a74-9221-dd69617071f9`

## A) Website chat (live site)

**Endpoint live:** `POST https://glowupbeautysolutions-260.netlify.app/api/glo/chat`  
(Function: `netlify/functions-clean/glo-chat.mjs` → `/.netlify/functions/glo-chat`)

1. Netlify site → **Site configuration → Environment variables**
2. Add **`XAI_API_KEY`** = your xAI key (never in the browser) — **required for live AI**
3. Optional: `XAI_CHAT_MODEL=grok-3-latest`, `XAI_AGENT_ID=00929ede-…`
4. Redeploy if you change env: `npm run deploy:full`
5. Open the site → **Chat with Glo** → free-form messages hit xAI; Book/Lead chips stay scripted
6. Leads → Dashboard → **Leads**; books → **Calendar**

Client: `src/lib/glo-chat-client.ts` → `AiReceptionist`  
Server: `netlify/functions-clean/glo-chat.mjs`

If the key is missing, Glo replies in **offline mode** (`fallback: true`) and chips still work.

## B) Phone go-live

1. xAI Console → Voice Agents → agent `00929ede-…`
2. **Attach** phone `+19714761615`
3. Webhook URL: `https://YOUR_PUBLIC_HOST/webhooks/xai/realtime`
4. Save signing secret → `XAI_WEBHOOK_SECRET`
5. Run bridge (or unified server):

```powershell
cd E:\GlowUP-build\glowkiss-main
$env:XAI_API_KEY = "xai-..."
$env:XAI_AGENT_ID = "00929ede-1eb1-4a74-9221-dd69617071f9"
$env:GLO_PHONE_E164 = "+19714761615"
$env:PORT = "8787"
npm run glo:server
# or: npm run glo:phone
```

6. Tunnel port 8787 (cloudflared / ngrok) and paste URL into Console  
7. Call +1 (971) 476-1615 — bridge logs `accept call`

See also: `docs/GLO_PHONE_SETUP.md`

## Local unified test

```powershell
$env:XAI_API_KEY = "xai-..."
npm run glo:server
# POST http://localhost:8787/api/glo/chat
# POST http://localhost:8787/webhooks/xai/realtime
# GET  http://localhost:8787/health
```

## Architecture

```
Visitor chat  →  /api/glo/chat (Netlify)  →  xAI chat completions  →  ACTIONS JSON
                 client applyGloActions → localStorage leads + calendar

Caller PSTN   →  +1 (971) 476-1615  →  xAI  →  webhook  →  glo:server / glo:phone
                 →  wss realtime + agent_id  →  Glo voice
```
