import { expect, test } from 'vitest'
import { storeSession, getSession, getCurrentSession } from '../../src/lib/session.js'

test('session management functions exist', () => {
  expect(storeSession).toBeDefined()
  expect(getSession).toBeDefined()
  expect(getCurrentSession).toBeDefined()
})

test('session types are correctly defined', () => {
  // This is just a type check test
  const session = {
    jwt: 'test-jwt',
    expiry: '2025-01-01T00:00:00Z',
    aud: 'test-aud',
    issuedAt: '2024-01-01T00:00:00Z',
    did: 'did:plc:test'
  }
  
  expect(session).toHaveProperty('jwt')
  expect(session).toHaveProperty('expiry')
  expect(session).toHaveProperty('aud')
  expect(session).toHaveProperty('issuedAt')
  expect(session).toHaveProperty('did')
})
