# Scrape stack (leads + public site data)

Anytime GlowUP. fetches a **public website** for leads or competitor facts, use this stack. Do not invent emails, occupancy, tickets, or unpublished prices.

| Layer | Job | Env |
|---|---|---|
| **Firecrawl** | First-choice page scrape + web search | `FIRECRAWL_API_KEY` |
| **Apify** | Instagram / TikTok public harvest | `APIFY_API_TOKEN` |
| **Zernio** | GlowUP. IG commenters (connected account) | `ZERNIO_API_KEY` |
| Serper | Google Places / web (discovery) | `SERPER_API_KEY` or `SERPER_KEY` |
| ScrapingBee | Fallback HTML + Google SERP if Firecrawl misses | `SCRAPINGBEE_API_KEY` |

Code: `src/lib/firecrawl-leads.ts`, `scrapingbee-leads.ts` (`fetchPublicHtml` is Firecrawl-first), `apify-leads.ts`, `company-prospect.ts`, `competitor-hunt.ts`.

Agent sessions: prefer Firecrawl scrape/search MCP, then Apify actors, then Zernio comments. Same facts-only rules.
