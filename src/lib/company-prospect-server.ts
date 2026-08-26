import { createServerFn } from '@tanstack/react-start'
import { runCompanyProspectSearch } from './company-prospect'

export const searchCompanyProspects = createServerFn({ method: 'POST' })
  .inputValidator((data: { city: string }) => data)
  .handler(async ({ data }) => runCompanyProspectSearch(data.city))
