import { createServerFn } from '@tanstack/react-start'
import type { CopywriterRequest } from '../agents/copywriter'
import { runCopywriterRequest } from '../agents/run-copywriter'

export const generateCopyPackServer = createServerFn({ method: 'POST' })
  .inputValidator((data: CopywriterRequest) => data)
  .handler(async ({ data }) => runCopywriterRequest(data))
