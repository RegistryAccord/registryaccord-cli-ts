// src/commands/identity/create.ts
// Command to create a new identity by generating a keypair and registering with the identity service

import { Command } from '@oclif/core'
import { fetchJSON, joinURL } from '../../lib/http.js'
import { resolveBases } from '../../lib/config.js'
import { IDENTITY_BASE_FLAG, JSON_FLAG, TIMEOUT_MS_FLAG, VERBOSE_FLAG } from '../../utils/flags.js'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

/** Response type from the identity creation API */
type CreateOut = { did: string }

/** Local keypair structure for storage */
type KeyPair = { did: string; publicKey: string; privateKey: string }

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
        
        // Generate keypair (simplified for this example)
        // In a real implementation, this would use proper cryptographic libraries
        const keyPair = this.generateKeyPair()
        
        if (flags.verbose) {
            this.log(`[debug] Generated keypair for DID: ${keyPair.did}`)
        }
        
        // Store keys securely
        const keyPath = this.storeKeyPair(keyPair)
        
        if (flags.verbose) {
            this.log(`[debug] Stored keys at: ${keyPath}`)
        }
        
        // Register with identity service
        const url = joinURL(bases.identityBase, '/xrpc/com.registryaccord.identity.create')
        
        if (flags.verbose) {
            this.log(`[debug] Registering with identity service at: ${url}`)
        }
        
        try {
            if (flags.verbose) {
                this.log(`[debug] POST ${url} timeout=${flags.timeoutMs ?? 'default'} body=${JSON.stringify({ publicKey: keyPair.publicKey })}`)
            }
            
            const out = await fetchJSON<CreateOut>(url, {
                method: 'POST',
                body: JSON.stringify({ publicKey: keyPair.publicKey }),
                headers: { 'Content-Type': 'application/json' },
                timeoutMs: flags.timeoutMs,
            })
            
            if (flags.verbose) {
                this.log(`[debug] Identity creation successful for DID: ${out.did}`)
            }
            
            if (flags.json) {
                this.log(JSON.stringify({
                    did: out.did,
                    publicKeyFingerprint: keyPair.publicKey.substring(0, 32) + '...',
                    keyPath: keyPath
                }))
            } else {
                this.log(`DID: ${out.did}`)
                this.log(`Public Key Fingerprint: ${keyPair.publicKey.substring(0, 32)}...`)
                this.log(`Key stored at: ${keyPath}`)
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
    
    /**
     * Generate a new keypair for identity creation
     * 
     * Note: This is a simplified implementation for demonstration purposes.
     * A production implementation would use proper cryptographic libraries like noble-ed25519.
     * 
     * @returns Generated keypair with DID
     */
    private generateKeyPair(): KeyPair {
        // This is a simplified implementation for demonstration
        // A real implementation would use proper cryptographic libraries like noble-ed25519
        const did = 'did:plc:' + Math.random().toString(36).substring(2, 15)
        const publicKey = 'public-key-' + Math.random().toString(36).substring(2, 15)
        const privateKey = 'private-key-' + Math.random().toString(36).substring(2, 15)
        return { did, publicKey, privateKey }
    }
    
    /**
     * Store the generated keypair securely on the local filesystem
     * 
     * Security measures:
     * - Directory permissions set to 0o700 (read/write/execute for owner only)
     * - File permissions set to 0o600 (read/write for owner only)
     * - JSON formatting for readability
     * 
     * @param keyPair - The keypair to store
     * @returns Path where the keypair was stored
     * @throws Error if there are file system permission issues
     */
    private storeKeyPair(keyPair: KeyPair): string {
        const registryAccordDir = path.join(os.homedir(), '.registryaccord')
        
        // Create directory with secure permissions if it doesn't exist
        if (!fs.existsSync(registryAccordDir)) {
            if (process.env.VERBOSE) {
                this.log(`[debug] Creating directory: ${registryAccordDir}`)
            }
            fs.mkdirSync(registryAccordDir, { mode: 0o700 })
        }
        
        // Ensure directory has correct permissions
        fs.chmodSync(registryAccordDir, 0o700)
        
        const keyPath = path.join(registryAccordDir, 'key.json')
        
        if (process.env.VERBOSE) {
            this.log(`[debug] Writing key file: ${keyPath}`)
        }
        
        // Write key file with secure permissions
        fs.writeFileSync(keyPath, JSON.stringify({
            did: keyPair.did,
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey
        }, null, 2), { mode: 0o600 })
        
        return keyPath
    }
}

