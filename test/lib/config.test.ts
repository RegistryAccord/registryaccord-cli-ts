import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { resolveBases } from '../../src/lib/config.js'

const resetEnv = (k: string) => {
  if (k in process.env) delete (process.env as any)[k]
}

describe('lib/config resolveBases', () => {
  const origEnv = process.env

  beforeEach(() => {
    resetEnv('RA_IDENTITY_BASE_URL')
    resetEnv('RA_CDV_BASE_URL')
    resetEnv('RA_GATEWAY_BASE_URL')
  })

  it('uses defaults when env and input are absent', () => {
    const bases = resolveBases()
    expect(bases.identityBase).toBe('http://localhost:8081')
    expect(bases.cdvBase).toBe('http://localhost:8082')
    expect(bases.gatewayBase).toBe('http://localhost:8083')
  })

  it('prefers env over defaults', () => {
    process.env.RA_IDENTITY_BASE_URL = 'http://id.local:9000'
    process.env.RA_CDV_BASE_URL = 'http://cdv.local:9001'
    process.env.RA_GATEWAY_BASE_URL = 'http://gateway.local:9002'
    const bases = resolveBases()
    expect(bases.identityBase).toBe('http://id.local:9000')
    expect(bases.cdvBase).toBe('http://cdv.local:9001')
    expect(bases.gatewayBase).toBe('http://gateway.local:9002')
  })

  it('prefers explicit inputs over env', () => {
    process.env.RA_IDENTITY_BASE_URL = 'http://id.local:9000'
    process.env.RA_CDV_BASE_URL = 'http://cdv.local:9001'
    process.env.RA_GATEWAY_BASE_URL = 'http://gateway.local:9002'
    const bases = resolveBases({
      identityBase: 'http://id.explicit:7000',
      cdvBase: 'http://cdv.explicit:7001',
      gatewayBase: 'http://gateway.explicit:7002',
    })
    expect(bases.identityBase).toBe('http://id.explicit:7000')
    expect(bases.cdvBase).toBe('http://cdv.explicit:7001')
    expect(bases.gatewayBase).toBe('http://gateway.explicit:7002')
  })

  // Restore env after each test
  afterEach(() => {
    process.env = origEnv
  })
})
