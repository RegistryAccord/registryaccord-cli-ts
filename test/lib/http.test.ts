import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchJSON, getDefaultTimeoutMs } from '../../src/lib/http.js'

const originalEnv = { ...process.env }

describe('lib/http', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
    delete (process.env as any).RA_HTTP_TIMEOUT_MS
  })

  it('getDefaultTimeoutMs uses env when valid', () => {
    expect(getDefaultTimeoutMs()).toBe(5000)
    process.env.RA_HTTP_TIMEOUT_MS = '1234'
    expect(getDefaultTimeoutMs()).toBe(1234)
    process.env.RA_HTTP_TIMEOUT_MS = 'abc'
    expect(getDefaultTimeoutMs()).toBe(5000)
  })

  it('fetchJSON returns parsed json on 200', async () => {
    const mock = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ hello: 'world' }),
    } as any)

    const out = await fetchJSON<{ hello: string }>('http://example.com/api')
    expect(out.hello).toBe('world')
    expect(mock).toHaveBeenCalled()
  })

  it('fetchJSON throws with message on non-ok', async () => {
    vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => 'invalid input',
    } as any)

    const error: any = await fetchJSON('http://example.com/api', { retries: 0 }).catch(err => err)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toContain('400 Bad Request: invalid input')
    expect(error.correlationId).toMatch(/^cli-/) // Check that correlationId is present
  })
  
  it('fetchJSON adds correlationId to requests', async () => {
    const mock = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ hello: 'world' }),
    } as any)

    await fetchJSON('http://example.com/api')
    expect(mock).toHaveBeenCalled()
    const callArgs = mock.mock.calls[0]
    const headers = (callArgs[1] as any).headers
    expect(headers).toHaveProperty('X-Correlation-ID')
    expect(headers['X-Correlation-ID']).toMatch(/^cli-/) // Check correlationId format
  })
  
  it('fetchJSON retries on 503 errors', async () => {
    const mock = vi.spyOn(global, 'fetch' as any)
    
    // First call fails with 503, second succeeds
    mock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => 'service unavailable',
    } as any)
    
    mock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ hello: 'world' }),
    } as any)

    const out = await fetchJSON<{ hello: string }>('http://example.com/api', { retries: 1 })
    expect(out.hello).toBe('world')
    expect(mock).toHaveBeenCalledTimes(2) // Should have retried once
  })
})
