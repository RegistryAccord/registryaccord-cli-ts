// src/utils/flags.ts
// Reusable oclif flags shared across commands to ensure consistency.
import { Flags } from '@oclif/core'

export const VERBOSE_FLAG = Flags.boolean({
  description: 'enable verbose logs',
  default: false,
})

export const JSON_FLAG = Flags.boolean({
  description: 'output JSON',
  default: false,
})

export const TIMEOUT_MS_FLAG = Flags.integer({
  description: 'HTTP timeout in milliseconds',
  min: 1,
})

export const CDV_BASE_FLAG = Flags.string({
  description: 'CDV service base URL (overrides RA_CDV_BASE_URL)',
})

export const IDENTITY_BASE_FLAG = Flags.string({
  description: 'Identity service base URL (overrides RA_IDENTITY_BASE_URL)',
})

export const GATEWAY_BASE_FLAG = Flags.string({
  description: 'Gateway service base URL (overrides RA_GATEWAY_BASE_URL)',
})

export const DID_FLAG = Flags.string({
  description: 'DID identifier',
  required: true,
})

export const AUD_FLAG = Flags.string({
  description: 'Audience identifier',
  required: true,
})

export const NONCE_FLAG = Flags.string({
  description: 'Nonce value',
  required: true,
})

export const LIMIT_FLAG = Flags.integer({
  description: 'Number of items to return',
  default: 20,
  min: 1,
  max: 100,
})

export const CURSOR_FLAG = Flags.string({
  description: 'Pagination cursor',
})
