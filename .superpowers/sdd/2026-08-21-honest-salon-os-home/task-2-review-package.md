# Review package Task 2

No git. Change is src/lib/proof-metrics.ts:
- ProofMetrics now has returningPct, returningGuestCount, guestCount
- computeProofMetrics sets them via returningPctFromVisits(confirmed) + guestKey map
- tsc --noEmit exit 0
- dashboard not touched
