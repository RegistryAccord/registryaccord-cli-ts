// src/commands/session/issue.ts
// Command to sign a nonce and request a JWT session token from the Identity service

import { Command } from '@oclif/core'
import { fetchJSON, joinURL } from '../../lib/http.js'
import { resolveBases } from '../../lib/config.js'
import { storeSession } from '../../lib/session.js'
import { IDENTITY_BASE_FLAG, JSON_FLAG, VERBOSE_FLAG, DID_FLAG, AUD_FLAG, NONCE_FLAG } from '../../utils/flags.js'

/** Response type from the session issue API */
type SessionIssueOut = { jwt: string; exp: string; aud: string; sub: string }

/** Request body for session issue */
type SessionIssueRequest = { did: string; aud: string; nonce: string }

/**
 * Issue a new session by signing a nonce and requesting a JWT from the Identity service
 * 
 * This command completes the session creation flow:
 * 1. Takes a nonce (from session:nonce command)
 * 2. Signs it with the local private key (TODO: implement)
 * 3. Sends it to the Identity service
 * 4. Receives and stores a JWT for future authenticated requests
 */
export default class SessionIssue extends Command {
    static description = 'Sign the nonce with the local private key; request a JWT from Identity'

    static flags = {
        did: DID_FLAG,
        aud: AUD_FLAG,
        nonce: NONCE_FLAG,
        identityBase: IDENTITY_BASE_FLAG,
        json: JSON_FLAG,
        verbose: VERBOSE_FLAG,
    }

    /**
     * Main execution function for the session issue command
     * 
     * Process:
     * 1. Parse and validate command flags (did, aud, and nonce are required)
     * 2. TODO: Sign the nonce with local private key
     * 3. Send POST request to /v1/session/issue endpoint
     * 4. Store the received JWT in the session file
     * 5. Output session details
     */
    async run(): Promise<void> {
        const { flags } = await this.parse(SessionIssue)
        
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
        
        if (!flags.nonce) {
            this.error('Nonce is required', {
                code: 'MISSING_NONCE',
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
        const url = joinURL(bases.identityBase, '/v1/session/issue')
        
        if (flags.verbose) {
            this.log('[debug] Starting session issue request')
        }
        
        // TODO: Implement local key signing before sending request
        // In a real implementation, we would:
        // 1. Load the private key from ~/.registryaccord/key.json
        // 2. Sign the nonce with the private key
        // 3. Include the signature in the request
        const requestBody: SessionIssueRequest = {
            did: flags.did,
            aud: flags.aud,
            nonce: flags.nonce
        }
        
        if (flags.verbose) {
            this.log(`[debug] Issuing session for DID: ${flags.did}, Audience: ${flags.aud}`)
        }
        
        try {
            if (flags.verbose) {
                this.log(`[debug] POST ${url} body=${JSON.stringify(requestBody)}`)
            }
                
            const out = await fetchJSON<SessionIssueOut>(url, {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' },
            })
            
            if (flags.verbose) {
                this.log('[debug] Session issue request successful')
            }
            
            // Store session for future use
            if (flags.verbose) {
                this.log('[debug] Storing session token')
            }
            
            try {
                storeSession({
                    jwt: out.jwt,
                    expiry: out.exp,
                    aud: out.aud,
                    issuedAt: new Date().toISOString(),
                    did: out.sub
                })
            } catch (err: any) {
                // Log error for debugging in verbose mode
                if (flags.verbose) {
                    this.log(`[error] Failed to store session: ${err.message}`)
                }
                
                this.error(`Failed to store session: ${err.message}`, {
                    code: 'SESSION_STORE_FAILED',
                    exit: err.exitCode || 2, // default to validation error
                })
            }
            
            if (flags.verbose) {
                this.log('[debug] Session stored successfully')
            }
            
            if (flags.json) {
                this.log(JSON.stringify(out))
            } else {
                this.log(`JWT: ${out.jwt}`)
                this.log(`Expires: ${out.exp}`)
                this.log(`Audience: ${out.aud}`)
                this.log(`Subject: ${out.sub}`)
                this.log(`Session stored successfully`)
            }
        } catch (err: any) {
            // Add correlation ID for troubleshooting if available
            const correlationId = err.correlationId ? ` (correlationId: ${err.correlationId})` : ''
            
            // Log error for debugging in verbose mode
            if (flags.verbose) {
                this.log(`[error] Session issue request failed: ${err.message}${correlationId}`)
            }
            
            this.error(`session issue failed: ${err.message}${correlationId}`, {
                code: 'SESSION_ISSUE_FAILED',
                exit: 4, // network/transport error
                suggestions: [
                    'Verify identity base URL is correct and reachable',
                    'Check that the provided DID exists',
                    'Ensure the nonce is valid and not expired',
                    'Check network connectivity'
                ],
            })
        }
    }
    
    /**
     * Validate URL format
     * 
     * @param url - URL to validate
     * @returns true if URL is valid, false otherwise
     */
    private isValidUrl(url: string): boolean {
        try {
            new URL(url)
            return true
        } catch {
            return false
        }
    }
    
    /**
     * Validate DID format
     * 
     * @param did - DID to validate
     * @returns true if DID format is valid, false otherwise
     */
    private isValidDid(did: string): boolean {
        // Basic DID format validation: did:method:identifier
        return /^did:[a-z0-9]+:[a-zA-Z0-9._-]+$/.test(did)
    }
}
