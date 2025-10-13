// src/commands/session/nonce.ts
// Command to fetch a short-lived nonce from the Identity service for session creation

import { Command } from '@oclif/core'
import { fetchJSON, joinURL } from '../../lib/http.js'
import { resolveBases } from '../../lib/config.js'
import { IDENTITY_BASE_FLAG, JSON_FLAG, VERBOSE_FLAG, DID_FLAG, AUD_FLAG } from '../../utils/flags.js'

/** Response type from the nonce generation API */
type NonceOut = { nonce: string; expiresAt: string }

/** Request body for nonce generation */
type NonceRequest = { did: string; aud: string }

/**
 * Fetch a short-lived nonce from the Identity service
 * 
 * This nonce is used in the session issue process where it gets signed
 * with the local private key before being sent back to the Identity service.
 */
export default class SessionNonce extends Command {
    static description = 'Fetch a short-lived nonce from Identity for the given DID and audience'

    static flags = {
        did: DID_FLAG,
        aud: AUD_FLAG,
        identityBase: IDENTITY_BASE_FLAG,
        json: JSON_FLAG,
        verbose: VERBOSE_FLAG,
    }

    /**
     * Main execution function for the session nonce command
     * 
     * Process:
     * 1. Parse and validate command flags (did and aud are required)
     * 2. Construct request body with DID and audience
     * 3. Send POST request to /v1/session/nonce endpoint
     * 4. Output nonce and expiration time
     */
    async run(): Promise<void> {
        const { flags } = await this.parse(SessionNonce)
        
        // Validate input parameters
        if (!flags.did) {
            this.error('DID is required', {
                code: 'MISSING_DID',
                exit: 2, // validation/usage error
            })
        }
        
        if (!flags.aud) {
            this.error('Audience is required', {
                code: 'MISSING_AUD',
                exit: 2, // validation/usage error
            })
        }
        
        if (flags.identityBase && !this.isValidUrl(flags.identityBase)) {
            this.error('Invalid identity base URL format', {
                code: 'INVALID_URL',
                exit: 2, // validation/usage error
            })
        }
        
        // Validate DID format (basic check)
        if (!this.isValidDid(flags.did)) {
            this.error('Invalid DID format. Expected format: did:method:identifier', {
                code: 'INVALID_DID',
                exit: 2, // validation/usage error
            })
        }
        
        const bases = resolveBases({ identityBase: flags.identityBase })
        const url = joinURL(bases.identityBase, '/v1/session/nonce')
        
        if (flags.verbose) {
            this.log('[debug] Starting session nonce request')
        }
        
        const requestBody: NonceRequest = {
            did: flags.did,
            aud: flags.aud
        }
        
        if (flags.verbose) {
            this.log(`[debug] Requesting nonce for DID: ${flags.did}, Audience: ${flags.aud}`)
        }
        
        try {
            if (flags.verbose) {
                this.log(`[debug] POST ${url} body=${JSON.stringify(requestBody)}`)
            }
                
            const out = await fetchJSON<NonceOut>(url, {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' },
            })
            
            if (flags.verbose) {
                this.log('[debug] Nonce request successful')
            }
            
            if (flags.json) {
                this.log(JSON.stringify(out))
            } else {
                this.log(`Nonce: ${out.nonce}`)
                this.log(`Expires: ${out.expiresAt}`)
            }
        } catch (err: any) {
            // Add correlation ID for troubleshooting if available
            const correlationId = err.correlationId ? ` (correlationId: ${err.correlationId})` : ''
            
            // Log error for debugging in verbose mode
            if (flags.verbose) {
                this.log(`[error] Session nonce request failed: ${err.message}${correlationId}`)
            }
            
            this.error(`session nonce failed: ${err.message}${correlationId}`, {
                code: 'SESSION_NONCE_FAILED',
                exit: 4, // network/transport error
                suggestions: [
                    'Verify identity base URL is correct and reachable',
                    'Check that the provided DID exists',
                    'Ensure the audience value is valid',
                    'Check network connectivity'
                ],
            })
        }
    }
    
    /**
     * Validate URL format and sanitize input
     * 
     * @param url - URL to validate
     * @returns true if URL is valid, false otherwise
     */
    private isValidUrl(url: string): boolean {
        // Basic input sanitization
        if (!url || typeof url !== 'string') {
            return false
        }
        
        // Trim whitespace
        url = url.trim()
        
        // Check for minimum length
        if (url.length === 0) {
            return false
        }
        
        // Check for maximum length (prevent potential DoS)
        if (url.length > 2048) {
            return false
        }
        
        try {
            const parsedUrl = new URL(url)
            
            // Only allow http and https protocols
            if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
                return false
            }
            
            // Check for valid hostname
            if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
                return false
            }
            
            // Check hostname length
            if (parsedUrl.hostname.length > 253) {
                return false
            }
            
            return true
        } catch {
            return false
        }
    }
    
    /**
     * Validate DID format and sanitize input
     * 
     * @param did - DID to validate
     * @returns true if DID format is valid, false otherwise
     */
    private isValidDid(did: string): boolean {
        // Basic input sanitization
        if (!did || typeof did !== 'string') {
            return false
        }
        
        // Trim whitespace
        did = did.trim()
        
        // Check for minimum length
        if (did.length === 0) {
            return false
        }
        
        // Check for maximum length (prevent potential DoS)
        if (did.length > 512) {
            return false
        }
        
        // Basic DID format validation: did:method:identifier
        // More restrictive pattern to prevent injection
        return /^did:[a-z0-9]+:[a-zA-Z0-9._-]+$/.test(did)
    }
}
