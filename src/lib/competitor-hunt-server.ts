import { createServerFn } from '@tanstack/react-start'
import { runCompetitorHunt } from './competitor-hunt'

export const huntCompetitorsServer = createServerFn({ method: 'POST' })
  .inputValidator((data: { city: string; ownName: string }) => data)
  .handler(async ({ data }) => runCompetitorHunt(data))
