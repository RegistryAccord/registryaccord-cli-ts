import { describe, it, expect } from 'vitest'
import { generateKeypair, signMessage, verifyMessage } from '../../src/services/crypto.js'

describe('crypto service', () => {
  it('generateKeypair returns base64 keys and did', async () => {
    const kp = await generateKeypair()
    expect(typeof kp.secretKeyBase64).toBe('string')
    expect(typeof kp.publicKeyBase64).toBe('string')
    expect(kp.did.startsWith('did:ra:ed25519:')).toBe(true)
  })

  it('sign/verify roundtrip succeeds', async () => {
    const kp = await generateKeypair()
    const msg = 'hello world'
    const sig = await signMessage(msg, kp.secretKeyBase64)
    const ok = await verifyMessage(msg, sig, kp.publicKeyBase64)
    expect(ok).toBe(true)
  })
})
