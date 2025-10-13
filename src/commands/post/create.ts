// src/commands/post/create.ts
// Command to create a new post in the CDV service with optional media attachment

import { Command, Flags } from '@oclif/core'
import { fetchJSON, joinURL } from '../../lib/http.js'
import { resolveBases } from '../../lib/config.js'
import { CDV_BASE_FLAG, JSON_FLAG, TIMEOUT_MS_FLAG, VERBOSE_FLAG } from '../../utils/flags.js'
import * as fs from 'fs'
import * as crypto from 'crypto'

/** Response type from the post creation API */
type PostCreateOut = { uri: string; cid: string; indexedAt: string }

/** Media reference to include in post records */
type MediaReference = { cid: string; mimeType: string }

/** Response type from the media upload initialization API */
type UploadInitOut = { uploadUrl: string; finalizeUrl: string }

/** Response type from the media upload finalization API */
type FinalizeOut = { cid: string; mimeType: string; size: number }

/** Request body for post creation */
type PostCreateBody = { 
  text: string; 
  authorDid: string; 
  media?: MediaReference 
}

/**
 * Create a new post in the CDV service
 * 
 * Supports optional media attachments with full upload workflow:
 * 1. Initialize media upload with the CDV service
 * 2. Upload file content to the provided URL
 * 3. Finalize upload with checksum verification
 * 4. Create post record with media reference
 */
export default class PostCreate extends Command {
    static description = 'Create a post in CDV with optional media attachment'

    static flags = {
        text: Flags.string({ description: 'post text', required: true }),
        media: Flags.string({ description: 'path to media file to upload' }),
        authorDid: Flags.string({ description: 'author DID', required: true }),
        cdvBase: CDV_BASE_FLAG,
        json: JSON_FLAG,
        verbose: VERBOSE_FLAG,
        timeoutMs: TIMEOUT_MS_FLAG,
    }

    /**
     * Main execution function for the post create command
     * 
     * Process:
     * 1. Parse and validate command flags
     * 2. Handle optional media upload
     * 3. Create post record with text and optional media reference
     * 4. Output post details
     */
    async run(): Promise<void> {
        const { flags } = await this.parse(PostCreate)
        
        // Validate input parameters
        if (!flags.text) {
            this.error('Post text is required', {
                code: 'MISSING_TEXT',
                exit: 2, // validation/usage error
            })
        }
        
        if (!flags.authorDid) {
            this.error('Author DID is required', {
                code: 'MISSING_AUTHOR_DID',
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
        if (!this.isValidDid(flags.authorDid)) {
            this.error('Invalid DID format. Expected format: did:method:identifier', {
                code: 'INVALID_DID',
                exit: 2, // validation/usage error
            })
        }
        
        // Validate media file exists if provided
        if (flags.media && !this.isFileExists(flags.media)) {
            this.error(`Media file not found: ${flags.media}`, {
                code: 'FILE_NOT_FOUND',
                exit: 2, // validation/usage error
            })
        }
        
        const bases = resolveBases({ cdvBase: flags.cdvBase })
        
        if (flags.verbose) {
            this.log('[debug] Starting post creation process')
        }
        
        let mediaRef: MediaReference | undefined
        
        // Handle media upload if provided
        if (flags.media) {
            if (flags.verbose) this.log(`[debug] Uploading media: ${flags.media}`)
            try {
                mediaRef = await this.uploadMedia(flags.media, bases.cdvBase, flags.timeoutMs)
            } catch (err: any) {
                // Log error for debugging in verbose mode
                if (flags.verbose) {
                    this.log(`[error] Media upload failed: ${err.message}`)
                }
                
                this.error(`Media upload failed: ${err.message}`, {
                    code: 'MEDIA_UPLOAD_FAILED',
                    exit: err.exitCode || 4, // default to network error
                })
            }
            
            if (flags.verbose && mediaRef) {
                this.log(`[debug] Media upload completed. CID: ${mediaRef.cid}`)
            }
        }
        
        // Create the post
        const url = joinURL(bases.cdvBase, '/v1/repo/record')
        const requestBody: PostCreateBody = { 
            text: flags.text, 
            authorDid: flags.authorDid,
            media: mediaRef
        }
        
        if (flags.verbose) {
            this.log(`[debug] Creating post for author: ${flags.authorDid}`)
        }
        
        try {
            if (flags.verbose) {
                this.log(`[debug] POST ${url} timeout=${flags.timeoutMs ?? 'default'} body=${JSON.stringify(requestBody)}`)
            }
            
            const out = await fetchJSON<PostCreateOut>(url, {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' },
                timeoutMs: flags.timeoutMs,
            })
            
            if (flags.verbose) {
                this.log(`[debug] Post creation successful. URI: ${out.uri}`)
            }
            
            if (flags.json) {
                this.log(JSON.stringify(out))
            } else {
                this.log(`Created post: ${out.uri}`)
                this.log(`  CID: ${out.cid}`)
                this.log(`  Indexed: ${out.indexedAt}`)
            }
        } catch (err: any) {
            // Add correlation ID for troubleshooting if available
            const correlationId = err.correlationId ? ` (correlationId: ${err.correlationId})` : ''
            
            // Log error for debugging in verbose mode
            if (flags.verbose) {
                this.log(`[error] Post creation failed: ${err.message}${correlationId}`)
            }
            
            this.error(`post create failed: ${err.message}${correlationId}`, {
                code: 'POST_CREATE_FAILED',
                exit: 5, // server error
                suggestions: [
                    'Verify CDV base URL is correct and reachable',
                    'Ensure author DID exists in identity service',
                    'Check network connectivity',
                    'Verify media file path is correct (if provided)'
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
    
    /**
     * Check if file exists
     * 
     * @param filePath - Path to file to check
     * @returns true if file exists, false otherwise
     */
    private isFileExists(filePath: string): boolean {
        try {
            fs.accessSync(filePath, fs.constants.F_OK)
            return true
        } catch {
            return false
        }
    }
    
    /**
     * Upload a media file with full checksum verification
     * 
     * Process:
     * 1. Read file and determine MIME type
     * 2. Compute SHA-256 checksum
     * 3. Initialize upload with CDV service
     * 4. Upload file content to provided URL
     * 5. Finalize upload with checksum verification
     * 
     * @param mediaPath - Path to the media file to upload
     * @param cdvBase - Base URL of the CDV service
     * @param timeoutMs - Optional timeout for HTTP requests
     * @returns Media reference with CID and MIME type
     * @throws Error if upload fails or checksum verification fails
     */
    private async uploadMedia(mediaPath: string, cdvBase: string, timeoutMs?: number): Promise<MediaReference> {
        if (process.env.VERBOSE) {
            this.log(`[debug] Starting media upload for: ${mediaPath}`)
        }
        
        // Read file
        if (process.env.VERBOSE) {
            this.log(`[debug] Reading file: ${mediaPath}`)
        }
        
        try {
            const fileBuffer = fs.readFileSync(mediaPath)
            const mimeType = this.getMimeType(mediaPath)
            
            if (process.env.VERBOSE) {
                this.log(`[debug] File MIME type: ${mimeType}, Size: ${fileBuffer.length} bytes`)
            }
            
            // Compute SHA-256 checksum
            if (process.env.VERBOSE) {
                this.log('[debug] Computing SHA-256 checksum')
            }
            
            const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex')
            
            if (process.env.VERBOSE) {
                this.log(`[debug] Media SHA-256: ${sha256}`)
            }
            
            // Initialize upload
            if (process.env.VERBOSE) {
                this.log('[debug] Initializing media upload')
            }
            
            const initUrl = joinURL(cdvBase, '/v1/media/uploadInit')
            const initOut = await fetchJSON<UploadInitOut>(initUrl, {
                method: 'POST',
                body: JSON.stringify({ mimeType, size: fileBuffer.length }),
                headers: { 'Content-Type': 'application/json' },
                timeoutMs
            })
            
            if (process.env.VERBOSE) {
                this.log(`[debug] Upload initialized. Upload URL: ${initOut.uploadUrl}`)
            }
            
            // Upload to S3 URL
            if (process.env.VERBOSE) {
                this.log('[debug] Uploading file content')
            }
            
            await fetch(initOut.uploadUrl, {
                method: 'PUT',
                body: fileBuffer,
                headers: { 'Content-Type': mimeType }
            })
            
            if (process.env.VERBOSE) {
                this.log('[debug] File content uploaded successfully')
            }
            
            // Finalize with checksum
            if (process.env.VERBOSE) {
                this.log('[debug] Finalizing upload with checksum verification')
            }
            
            const finalizeUrl = initOut.finalizeUrl
            const finalizeOut = await fetchJSON<FinalizeOut>(finalizeUrl, {
                method: 'POST',
                body: JSON.stringify({ checksum: sha256 }),
                headers: { 'Content-Type': 'application/json' },
                timeoutMs
            })
            
            if (process.env.VERBOSE) {
                this.log(`[debug] Upload finalized. Server CID: ${finalizeOut.cid}`)
            }
            
            // Verify server checksum matches
            if (finalizeOut.cid !== sha256) {
                const error = new Error(`Checksum mismatch: expected ${sha256}, got ${finalizeOut.cid}`)
                if (process.env.VERBOSE) {
                    this.log(`[error] ${error.message}`)
                }
                throw error
            }
            
            if (process.env.VERBOSE) {
                this.log('[debug] Checksum verification successful')
            }
            
            return { cid: finalizeOut.cid, mimeType: finalizeOut.mimeType }
        } catch (err: any) {
            // Re-throw with more context
            throw new Error(`Failed to upload media ${mediaPath}: ${err.message}`)
        }
    }
    
    /**
     * Determine MIME type based on file extension
     * 
     * @param filePath - Path to the file
     * @returns MIME type string
     */
    private getMimeType(filePath: string): string {
        const ext = filePath.split('.').pop()?.toLowerCase()
        switch (ext) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg'
            case 'png':
                return 'image/png'
            case 'gif':
                return 'image/gif'
            case 'mp4':
                return 'video/mp4'
            case 'mov':
                return 'video/quicktime'
            default:
                return 'application/octet-stream'
        }
    }
}

