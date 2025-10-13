// src/commands/post/list.ts
import { Command, Flags } from '@oclif/core'
import { fetchJSON, joinURL } from '../../lib/http.js'
import { resolveBases } from '../../lib/config.js'
import { CDV_BASE_FLAG, JSON_FLAG, TIMEOUT_MS_FLAG, VERBOSE_FLAG, DID_FLAG, LIMIT_FLAG, CURSOR_FLAG } from '../../utils/flags.js'

type PostItem = { text: string; authorDid: string; createdAt: string }
type PostListOut = { items: PostItem[]; nextCursor?: string }

export default class PostList extends Command {
    static description = 'Page through CDV GET /v1/repo/listRecords with deterministic cursors'

    static flags = {
        did: DID_FLAG,
        collection: Flags.string({ description: 'collection NSID' }),
        limit: LIMIT_FLAG,
        cursor: CURSOR_FLAG,
        since: Flags.string({ description: 'ISO timestamp to filter records since' }),
        until: Flags.string({ description: 'ISO timestamp to filter records until' }),
        cdvBase: CDV_BASE_FLAG,
        json: JSON_FLAG,
        verbose: VERBOSE_FLAG,
        timeoutMs: TIMEOUT_MS_FLAG,
    }

    async run(): Promise<void> {
        const { flags } = await this.parse(PostList)
        
        // Validate input parameters
        if (!flags.did) {
            this.error('DID is required', {
                code: 'MISSING_DID',
                exit: 2, // validation/usage error
            })
        }
        
        if (flags.cdvBase && !this.isValidUrl(flags.cdvBase)) {
            this.error('Invalid CDV base URL format', {
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
        
        // Validate timestamp formats if provided
        if (flags.since && !this.isValidIsoTimestamp(flags.since)) {
            this.error('Invalid since timestamp format. Expected ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)', {
                code: 'INVALID_TIMESTAMP',
                exit: 2, // validation/usage error
            })
        }
        
        if (flags.until && !this.isValidIsoTimestamp(flags.until)) {
            this.error('Invalid until timestamp format. Expected ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)', {
                code: 'INVALID_TIMESTAMP',
                exit: 2, // validation/usage error
            })
        }
        
        const bases = resolveBases({ cdvBase: flags.cdvBase })
        const u = new URL(joinURL(bases.cdvBase, '/v1/repo/listRecords'))
        
        u.searchParams.set('did', flags.did)
        if (flags.collection) u.searchParams.set('collection', flags.collection)
        if (flags.limit) u.searchParams.set('limit', String(flags.limit))
        if (flags.cursor) u.searchParams.set('cursor', flags.cursor)
        if (flags.since) u.searchParams.set('since', flags.since)
        if (flags.until) u.searchParams.set('until', flags.until)

        try {
            if (flags.verbose) this.log(`[debug] GET ${u.toString()} timeout=${flags.timeoutMs ?? 'default'}`)
            const out = await fetchJSON<PostListOut>(u.toString(), {
                method: 'GET',
                timeoutMs: flags.timeoutMs,
            })
            
            if (flags.json) {
                this.log(JSON.stringify(out))
            } else {
                this.log(`Posts for ${flags.did}:`)
                for (const it of out.items) {
                    this.log(`  [${it.createdAt}] ${it.text}`)
                }
                if (out.nextCursor) {
                    this.log(`\nNext cursor: ${out.nextCursor}`)
                }
            }
        } catch (err: any) {
            this.error(`post list failed: ${err.message}`, {
                code: 'POST_LIST_FAILED',
                exit: 4, // network/transport error
                suggestions: ['Verify CDV base URL', 'Check author DID and network reachability'],
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
    
    /**
     * Validate ISO 8601 timestamp format
     * 
     * @param timestamp - Timestamp to validate
     * @returns true if timestamp format is valid, false otherwise
     */
    private isValidIsoTimestamp(timestamp: string): boolean {
        // Basic ISO 8601 timestamp validation
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(timestamp)
    }
}

