# Custom domain — glowupbeautysolutions.com

## Netlify (done)

| Item | Value |
|------|--------|
| Site | `glowupbeautysolutions-260` |
| Site ID | `f73e88c5-30bb-4291-8905-c203fbaecaba` |
| Primary domain | `glowupbeautysolutions.com` |
| Alias | `www.glowupbeautysolutions.com` |
| Free URL (always works) | https://glowupbeautysolutions-260.netlify.app |

## DNS (you must change — currently IONOS / 1&1)

Public DNS today:

- **NS:** `ns*.ui-dns.*` (IONOS)
- **A:** `74.208.236.251` (old host — not Netlify)

Until DNS points at Netlify, the custom domain will not load the GlowUP app and SSL cannot finish.

### Records to set at IONOS (or wherever you manage DNS)

| Type | Host / name | Value | TTL |
|------|-------------|--------|-----|
| **A** | `@` (root / glowupbeautysolutions.com) | `75.2.60.5` | 3600 or default |
| **CNAME** | `www` | `glowupbeautysolutions-260.netlify.app` | 3600 or default |

Notes:

1. **Remove** or replace any old A/CNAME for `@` and `www` that point at `74.208.236.251`.
2. Do **not** put a CNAME on the bare apex `@` at most DNS panels — use the **A** record above.
3. Wait 5–60 minutes (sometimes up to 24h), then Netlify will issue HTTPS automatically.
4. Netlify UI: **Domain management** → domain → **Verify DNS configuration** / wait for SSL green.

### Optional: Netlify DNS

If you prefer Netlify to manage DNS:

1. Netlify → Domains → Add / configure `glowupbeautysolutions.com` for DNS
2. At IONOS, change **nameservers** to the four Netlify NS hosts Netlify shows
3. Then A/CNAME are managed inside Netlify

## After DNS works

- https://glowupbeautysolutions.com  
- https://www.glowupbeautysolutions.com  
- Chat API: `https://glowupbeautysolutions.com/api/glo/chat`  
- Old `.netlify.app` URL keeps working  
