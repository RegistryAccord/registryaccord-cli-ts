// src/commands/feed/following.ts
import { Command } from '@oclif/core'
import { fetchJSON, joinURL } from '../../lib/http.js'
import { resolveBases } from '../../lib/config.js'
import { GATEWAY_BASE_FLAG, JSON_FLAG, VERBOSE_FLAG, DID_FLAG, LIMIT_FLAG, CURSOR_FLAG } from '../../utils/flags.js'

type FeedItem = { did: string; text: string; createdAt: string }
type FeedFollowingOut = { items: FeedItem[]; nextCursor?: string }

export default class FeedFollowing extends Command {
    static description = 'Get feed of posts from followed users'

    static flags = {
        viewerDid: DID_FLAG,
        limit: LIMIT_FLAG,
        cursor: CURSOR_FLAG,
        gatewayBase: GATEWAY_BASE_FLAG,
        json: JSON_FLAG,
        verbose: VERBOSE_FLAG,
    }

    async run(): Promise<void> {
        const { flags } = await this.parse(FeedFollowing)
        
        // Validate input parameters
        if (!flags.viewerDid) {
            this.error('Viewer DID is required', {
                code: 'MISSING_VIEWER_DID',
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
        if (!this.isValidDid(flags.viewerDid)) {
            this.error('Invalid DID format. Expected format: did:method:identifier', {
                code: 'INVALID_DID',
                exit: 2, // validation/usage error
            })
        }
        
        const bases = resolveBases({ gatewayBase: flags.gatewayBase })
        const u = new URL(joinURL(bases.gatewayBase, '/v1/feed/following'))
        
        u.searchParams.set('viewerDid', flags.viewerDid)
        if (flags.limit) u.searchParams.set('limit', String(flags.limit))
        if (flags.cursor) u.searchParams.set('cursor', flags.cursor)
        
        try {
            if (flags.verbose) this.log(`[debug] GET ${u.toString()}`)
            
            const out = await fetchJSON<FeedFollowingOut>(u.toString(), {
                method: 'GET',
            })
            
            if (flags.json) {
                this.log(JSON.stringify(out))
            } else {
                this.log(`Feed for ${flags.viewerDid}:`)
                for (const item of out.items) {
                    this.log(`  [${item.createdAt}] ${item.did}: ${item.text}`)
                }
                if (out.nextCursor) {
                    this.log(`\nNext cursor: ${out.nextCursor}`)
                }
            }
        } catch (err: any) {
            this.error(`feed following failed: ${err.message}`, {
                code: 'FEED_FOLLOWING_FAILED',
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
