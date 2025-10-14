// src/commands/identity/create.ts
// Command to create a new identity by generating a keypair and registering with the identity service

import { Command } from '@oclif/core'
import { fetchJSON, joinURL } from '../../lib/http.js'
import { resolveBases } from '../../lib/config.js'
import { saveKey } from '../../services/storage.js'
import { generateKeypair } from '../../services/crypto.js'
import { IDENTITY_BASE_FLAG, JSON_FLAG, TIMEOUT_MS_FLAG, VERBOSE_FLAG } from '../../utils/flags.js'

/** Response type from the identity creation API */
type CreateOut = { did: string }


/**
 * Create a new identity by:
 * 1. Generating a new DID keypair locally
 * 2. Storing the keys securely in ~/.registryaccord/key.json
 * 3. Registering the public key with the identity service
 */
export default class IdentityCreate extends Command {
    static description = 'Generate a new DID (plc) keypair locally; store keys under ~/.registryaccord/key.json'

    static flags = {
        identityBase: IDENTITY_BASE_FLAG,
        json: JSON_FLAG,
        verbose: VERBOSE_FLAG,
        timeoutMs: TIMEOUT_MS_FLAG,
    }

    /**
     * Main execution function for the identity create command
     * 
     * Process:
     * 1. Parse and validate command flags
     * 2. Generate local keypair
     * 3. Store keys securely
     * 4. Register with identity service
     * 5. Output results
     */
    async run(): Promise<void> {
        const { flags } = await this.parse(IdentityCreate)
        
        // Validate input parameters
        if (flags.identityBase && !this.isValidUrl(flags.identityBase)) {
            this.error('Invalid identity base URL format', {
                code: 'INVALID_URL',
                exit: 2, // validation/usage error
            })
        }
        
        const bases = resolveBases({ identityBase: flags.identityBase })
        
        if (flags.verbose) {
            this.log('[debug] Starting identity creation process')
        }
        
        // Generate keypair using proper cryptographic libraries
        const keypair = await generateKeypair()
        
        if (flags.verbose) {
            this.log(`[debug] Generated keypair for DID: ${keypair.did}`)
        }
        
        // Store keys securely
        await saveKey({
            did: keypair.did,
            secretKeyBase64: keypair.secretKeyBase64,
            publicKeyBase64: keypair.publicKeyBase64
        })
        
        if (flags.verbose) {
            this.log(`[debug] Stored keys at: ~/.registryaccord/key.json`)
        }
        
        // Register with identity service
        const url = joinURL(bases.identityBase, '/xrpc/com.registryaccord.identity.create')
        
        if (flags.verbose) {
            this.log(`[debug] Registering with identity service at: ${url}`)
        }
        
        try {
            if (flags.verbose) {
                this.log(`[debug] POST ${url} timeout=${flags.timeoutMs ?? 'default'} body=${JSON.stringify({ publicKey: keypair.publicKeyBase64 })}`)
            }
            
            const out = await fetchJSON<CreateOut>(url, {
                method: 'POST',
                body: JSON.stringify({ publicKey: keypair.publicKeyBase64 }),
                headers: { 'Content-Type': 'application/json' },
                timeoutMs: flags.timeoutMs,
            })
            
            if (flags.verbose) {
                this.log(`[debug] Identity creation successful for DID: ${out.did}`)
            }
            
            if (flags.json) {
                this.log(JSON.stringify({
                    did: out.did,
                    publicKeyFingerprint: keypair.publicKeyBase64.substring(0, 32) + '...',
                    keyPath: '~/.registryaccord/key.json'
                }))
            } else {
                this.log(`DID: ${out.did}`)
                this.log(`Public Key Fingerprint: ${keypair.publicKeyBase64.substring(0, 32)}...`)
                this.log(`Key stored at: ~/.registryaccord/key.json`)
            }
        } catch (err: any) {
            // Add correlation ID for troubleshooting if available
            const correlationId = err.correlationId ? ` (correlationId: ${err.correlationId})` : ''
            
            // Determine appropriate exit code based on error type
            let exitCode = 5 // server error by default
            if (err.status) {
                if (err.status === 400) {
                    exitCode = 2 // validation/usage error
                } else if (err.status === 401 || err.status === 403) {
                    exitCode = 3 // auth error
                } else if (err.status >= 500) {
                    exitCode = 5 // server error
                } else {
                    exitCode = 4 // network/transport error
                }
            } else if (err.name === 'AbortError') {
                exitCode = 4 // network/transport error
            } else if (err.exitCode) {
                // Use exit code from our custom error types
                exitCode = err.exitCode
            }
            
            // Log error for debugging in verbose mode
            if (flags.verbose) {
                this.log(`[error] Identity creation failed: ${err.message}${correlationId}`)
            }
            
            this.error(`identity create failed: ${err.message}${correlationId}`, {
                code: 'IDENTITY_CREATE_FAILED',
                exit: exitCode,
                suggestions: [
                    'Verify identity base URL is correct and reachable',
                    'Check network connectivity',
                    'Ensure the identity service is running'
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
    
}

