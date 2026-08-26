# Push Glo voice onto +1 (971) 476-1615

## Locked IDs

| Item | Value |
|------|--------|
| **Phone** | `+19714761615` · +1 (971) 476-1615 |
| **xAI agent** | `00929ede-1eb1-4a74-9221-dd69617071f9` |
| **Bridge** | `npm run glo:phone` → `scripts/glo-voice-phone-bridge.mjs` |
| **Webhook path** | `POST /webhooks/xai/realtime` |

## How it works

```
Caller → +1 (971) 476-1615
       → xAI telephony / SIP
       → webhook realtime.call.incoming → your bridge
       → wss://api.x.ai/v1/realtime?call_id=...&agent_id=00929ede-...
       → Glo speaks (Console agent config)
```

## Console steps (you must do once)

1. Open [xAI Console](https://console.x.ai) → **Voice Agents**
2. Open agent **`00929ede-1eb1-4a74-9221-dd69617071f9`**
3. **Phone numbers**
   - If the number is already in the account: **Attach / assign** it to this agent  
   - Or **import / SIP trunk** so PSTN hits this agent
4. **Webhooks**
   - URL: `https://YOUR_PUBLIC_HOST/webhooks/xai/realtime`  
   - Copy **signing secret** → set `XAI_WEBHOOK_SECRET`
5. Instructions (recommended on the agent):  
   *You are Glo for GlowUP. Lead capture + book appointments. Warm, short, professional. Collect name and phone. Escalate complex issues.*

## Run the bridge (always-on host)

Phone media needs a **long-lived process** (not static Netlify). Use your PC + tunnel for tests, or Railway/Fly later.

**Preferred (chat + phone in one process):**

```powershell
cd E:\GlowUP-build\glowkiss-main
$env:XAI_API_KEY = "xai-..."
$env:XAI_AGENT_ID = "00929ede-1eb1-4a74-9221-dd69617071f9"
$env:GLO_PHONE_E164 = "+19714761615"
# $env:XAI_WEBHOOK_SECRET = "whsec_..."
$env:PORT = "8787"
npm run glo:server
```

**Phone-only (same webhook path):**

```powershell
npm run glo:phone
```

Expose port 8787 (example with cloudflared / ngrok):

```text
https://YOUR_TUNNEL/webhooks/xai/realtime
```

Paste that URL into the agent phone webhook settings.

## Test

1. `GET https://YOUR_TUNNEL/health` → `{ ok: true, phone: "+19714761615", ... }`
2. Call **+1 (971) 476-1615**
3. Bridge logs `webhook realtime.call.incoming` then `accepting call`
4. Glo should answer

## Site already shows the number

Marketing + chat FAB: **CALL GLO** / `tel:+19714761615`

## Next engineering

- Tool calls on the call session → `mcp-booking-crm` (book + capture_lead)
- Host bridge 24/7 on Railway with `PUBLIC_BASE_URL`
- Recording / transcript archive to dashboard
