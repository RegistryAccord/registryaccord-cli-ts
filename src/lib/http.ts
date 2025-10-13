// src/lib/http.ts
// Shared HTTP utilities for making API calls with timeouts, retries, and structured responses.

import { NetworkError, ServerError, AuthError } from './errors.js'
import { Logger, createLoggerWithCorrelationId } from './logger.js'

/**
 * Options for JSON HTTP requests with retry and timeout configuration.
 */
export type FetchJSONOptions = RequestInit & {
    /** Timeout in milliseconds for the request */
    timeoutMs?: number
    /** Number of retry attempts (default: 3) */
    retries?: number
    /** Base backoff delay in milliseconds (default: 1000) */
    backoffMs?: number
}

/**
 * Generate a correlation ID for tracking requests across services.
 * Format: cli-{timestamp}-{random}
 */
function generateCorrelationId(): string {
    return 'cli-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
}

/**
 * Resolve default timeout from environment or fallback.
 * RA_HTTP_TIMEOUT_MS can override the default. Invalid values are ignored.
 * @returns Timeout in milliseconds (default: 5000)
 */
export function getDefaultTimeoutMs(): number {
    const env = process.env.RA_HTTP_TIMEOUT_MS
    const parsed = env ? Number.parseInt(env, 10) : NaN
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000
}

/**
 * Perform an HTTP request and parse JSON when content-type indicates JSON.
 * Throws with a helpful message when status is non-OK.
 * 
 * Features:
 * - Automatic retry on 429, 503, and network errors
 * - Exponential backoff
 * - Request correlation tracking
 * - Timeout support
 * - JSON body serialization
 * 
 * @param url - The URL to fetch
 * @param opts - Request options including retry and timeout configuration
 * @returns Parsed JSON response
 * @throws Specific error types based on the error condition
 */
export async function fetchJSON<T>(url: string, opts: FetchJSONOptions = {}): Promise<T> {
    const retries = opts.retries ?? 3
    const backoffMs = opts.backoffMs ?? 1000
    const correlationId = generateCorrelationId()
    const logger = createLoggerWithCorrelationId(correlationId)
    
    logger.debug('Starting HTTP request', { url, retries, backoffMs })
    
    // Add correlation ID to headers for request tracing
    const headers = {
        'X-Correlation-ID': correlationId,
        ...(opts.headers || {})
    }
    
    // Convert body to JSON if it's an object
    let body = opts.body
    if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
        body = JSON.stringify(body)
        // @ts-expect-error: Headers type doesn't allow string indexing, but this works at runtime
        headers['Content-Type'] = 'application/json'
    }
    
    // Attempt the request with retries
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController()
        const timeoutMs = opts.timeoutMs || getDefaultTimeoutMs()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        
        logger.debug('Making HTTP request attempt', { attempt, timeoutMs })

        try {
            // Make the HTTP request
            const res = await fetch(url, {
                ...opts,
                headers,
                body: body as any,
                signal: controller.signal,
            })
            clearTimeout(timeout)

            // Handle non-OK responses
            if (!res.ok) {
                const errText = await res.text().catch(() => 'unknown error')
                const errorMessage = `${res.status} ${res.statusText}: ${errText}`
                
                logger.warn('HTTP request failed', { 
                    status: res.status, 
                    statusText: res.statusText, 
                    error: errText,
                    attempt
                })
                
                // Create specific error types based on status code
                let error: Error
                if (res.status === 401 || res.status === 403) {
                    error = new AuthError(errorMessage, 'HTTP_AUTH_ERROR', correlationId)
                } else if (res.status >= 500) {
                    error = new ServerError(errorMessage, 'HTTP_SERVER_ERROR', correlationId)
                } else if (res.status >= 400) {
                    error = new NetworkError(errorMessage, 'HTTP_CLIENT_ERROR', correlationId)
                } else {
                    error = new NetworkError(errorMessage, 'HTTP_UNKNOWN_ERROR', correlationId)
                }
                
                // Add status property for compatibility
                (error as any).status = res.status
                
                // Retry on rate limiting or service unavailable
                if ((res.status === 429 || res.status === 503) && attempt < retries) {
                    const delay = backoffMs * Math.pow(2, attempt)
                    logger.debug('Retrying HTTP request', { delay, attempt })
                    // In a real implementation, we might want to use a more sophisticated backoff
                    await new Promise(resolve => setTimeout(resolve, delay))
                    continue
                }
                
                logger.error('HTTP request failed permanently', { 
                    status: res.status, 
                    statusText: res.statusText, 
                    error: errText,
                    attempt
                })
                
                throw error
            }

            // Parse and return successful JSON response
            const result = await res.json()
            logger.debug('HTTP request successful', { attempt })
            return result
        } catch (err: any) {
            clearTimeout(timeout)
            
            // Handle timeout errors
            if (err.name === 'AbortError') {
                logger.warn('HTTP request timed out', { timeoutMs, attempt })
                const timeoutError = new NetworkError(`HTTP timeout after ${timeoutMs}ms`, 'HTTP_TIMEOUT', correlationId)
                // Retry on timeout errors
                if (attempt < retries) {
                    const delay = backoffMs * Math.pow(2, attempt)
                    logger.debug('Retrying after timeout', { delay, attempt })
                    await new Promise(resolve => setTimeout(resolve, delay))
                    continue
                }
                logger.error('HTTP request timed out permanently', { timeoutMs })
                throw timeoutError
            }
            
            // If it's already one of our custom errors, rethrow it
            if (err instanceof AuthError || err instanceof ServerError || err instanceof NetworkError) {
                // Retry on server errors and network errors
                if (attempt < retries && (err instanceof ServerError || err instanceof NetworkError)) {
                    const delay = backoffMs * Math.pow(2, attempt)
                    logger.debug('Retrying after error', { delay, attempt, error: err.message })
                    await new Promise(resolve => setTimeout(resolve, delay))
                    continue
                }
                logger.error('HTTP request failed permanently with custom error', { 
                    error: err.message,
                    code: err.code,
                    attempt
                })
                throw err
            }
            
            // For other errors, wrap them in NetworkError
            const networkError = new NetworkError(err.message, 'HTTP_NETWORK_ERROR', correlationId)
            // Add status property if it exists
            if (err.status) {
                (networkError as any).status = err.status
            }
            
            // Retry on network errors
            if (attempt < retries) {
                const delay = backoffMs * Math.pow(2, attempt)
                logger.debug('Retrying after network error', { delay, attempt, error: err.message })
                await new Promise(resolve => setTimeout(resolve, delay))
                continue
            }
            
            logger.error('HTTP request failed permanently with network error', { 
                error: err.message,
                attempt
            })
            
            throw networkError
        }
    }
    
    // This should never be reached due to the loop condition
    const error = new Error('Unreachable code in fetchJSON')
    logger.error('Unreachable code reached in fetchJSON', { error: error.message })
    throw error
}

/**
 * Join a base URL with a path, replacing the pathname portion.
 * This ensures proper URL construction and avoids double slashes.
 * 
 * @param base - Base URL
 * @param path - Path to append
 * @returns Complete URL as string
 */
export function joinURL(base: string, path: string): string {
    const u = new URL(base)
    u.pathname = path
    return u.toString()
}
