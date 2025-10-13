import { expect, test } from 'vitest'
import { resolveBases } from '../../../src/lib/config.js'

test('identity:create command structure', async () => {
  // This is a smoke test to verify the command can be imported and has the right structure
  const { default: IdentityCreate } = await import('../../../src/commands/identity/create.js')
  
  expect(IdentityCreate).toBeDefined()
  expect(IdentityCreate.description).toContain('Generate a new DID')
  expect(IdentityCreate.flags).toBeDefined()
})

test('config resolution works', () => {
  const bases = resolveBases()
  expect(bases.identityBase).toBe('http://localhost:8081')
  expect(bases.cdvBase).toBe('http://localhost:8082')
  expect(bases.gatewayBase).toBe('http://localhost:8083')
})
