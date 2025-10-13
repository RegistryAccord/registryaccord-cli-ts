// src/commands/profile/get.ts
import { Command } from '@oclif/core'
import { fetchJSON, joinURL } from '../../lib/http.js'
import { resolveBases } from '../../lib/config.js'
import { GATEWAY_BASE_FLAG, JSON_FLAG, VERBOSE_FLAG, DID_FLAG } from '../../utils/flags.js'

type Profile = { did: string; displayName: string; description: string; createdAt: string }
type ProfileGetOut = { profile: Profile }

export default class ProfileGet extends Command {
    static description = 'Get profile information for a DID'

    static flags = {
        did: DID_FLAG,
        gatewayBase: GATEWAY_BASE_FLAG,
        json: JSON_FLAG,
        verbose: VERBOSE_FLAG,
    }

    async run(): Promise<void> {
        const { flags } = await this.parse(ProfileGet)
        
        // Validate input parameters
        if (!flags.did) {
            this.error('DID is required', {
                code: 'MISSING_DID',
                exit: 2, // validation/usage error
            })
        }
        
        if (flags.gatewayBase && !this.isValidUrl(flags.gatewayBase)) {
            this.error('Invalid gateway base URL format', {
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
        
        const bases = resolveBases({ gatewayBase: flags.gatewayBase })
        const u = new URL(joinURL(bases.gatewayBase, '/v1/profile'))
        
        u.searchParams.set('did', flags.did)
        
        try {
            if (flags.verbose) this.log(`[debug] GET ${u.toString()}`)
            
            const out = await fetchJSON<ProfileGetOut>(u.toString(), {
                method: 'GET',
            })
            
            if (flags.json) {
                this.log(JSON.stringify(out.profile))
            } else {
                this.log(`Profile for ${out.profile.did}:`)
                this.log(`  Display Name: ${out.profile.displayName}`)
                this.log(`  Description: ${out.profile.description}`)
                this.log(`  Created: ${out.profile.createdAt}`)
            }
        } catch (err: any) {
            this.error(`profile get failed: ${err.message}`, {
                code: 'PROFILE_GET_FAILED',
                exit: 4, // network/transport error
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
