// src/commands/search.ts
import { Command, Flags } from '@oclif/core'
import { fetchJSON, joinURL } from '../lib/http.js'
import { resolveBases } from '../lib/config.js'
import { GATEWAY_BASE_FLAG, JSON_FLAG, VERBOSE_FLAG, LIMIT_FLAG, CURSOR_FLAG } from '../utils/flags.js'

type SearchResult = { did?: string; text?: string; type: string; score: number }
type SearchOut = { items: SearchResult[]; nextCursor?: string }

export default class Search extends Command {
    static description = 'Search for posts, profiles, or content'

    static flags = {
        q: Flags.string({
            description: 'Search query',
            required: true,
        }),
        type: Flags.string({
            description: 'Type of content to search for (post|profile|all)',
            options: ['post', 'profile', 'all'],
            default: 'all',
        }),
        limit: LIMIT_FLAG,
        cursor: CURSOR_FLAG,
        gatewayBase: GATEWAY_BASE_FLAG,
        json: JSON_FLAG,
        verbose: VERBOSE_FLAG,
    }

    async run(): Promise<void> {
        const { flags } = await this.parse(Search)
        
        // Validate input parameters
        if (!flags.q || flags.q.trim().length === 0) {
            this.error('Search query is required and cannot be empty', {
                code: 'MISSING_QUERY',
                exit: 2, // validation/usage error
            })
        }
        
        if (flags.gatewayBase && !this.isValidUrl(flags.gatewayBase)) {
            this.error('Invalid gateway base URL format', {
                code: 'INVALID_URL',
                exit: 2, // validation/usage error
            })
        }
        
        const bases = resolveBases({ gatewayBase: flags.gatewayBase })
        const u = new URL(joinURL(bases.gatewayBase, '/v1/search'))
        
        u.searchParams.set('q', flags.q)
        u.searchParams.set('type', flags.type)
        if (flags.limit) u.searchParams.set('limit', String(flags.limit))
        if (flags.cursor) u.searchParams.set('cursor', flags.cursor)
        
        try {
            if (flags.verbose) this.log(`[debug] GET ${u.toString()}`)
            
            const out = await fetchJSON<SearchOut>(u.toString(), {
                method: 'GET',
            })
            
            if (flags.json) {
                this.log(JSON.stringify(out))
            } else {
                this.log(`Search results for "${flags.q}":`)
                for (const item of out.items) {
                    if (item.type === 'post' && item.text) {
                        this.log(`  [Post] ${item.text.substring(0, 50)}${item.text.length > 50 ? '...' : ''} (Score: ${item.score})`)
                    } else if (item.type === 'profile' && item.did) {
                        this.log(`  [Profile] ${item.did} (Score: ${item.score})`)
                    }
                }
                if (out.nextCursor) {
                    this.log(`\nNext cursor: ${out.nextCursor}`)
                }
            }
        } catch (err: any) {
            this.error(`search failed: ${err.message}`, {
                code: 'SEARCH_FAILED',
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
}
