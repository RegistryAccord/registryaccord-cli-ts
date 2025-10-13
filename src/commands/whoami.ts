// src/commands/whoami.ts
import { Command } from '@oclif/core'
import { getCurrentSession } from '../lib/session.js'
import { JSON_FLAG, VERBOSE_FLAG } from '../utils/flags.js'

export default class Whoami extends Command {
    static description = 'Print current DID and token expiry if a session is active'

    static flags = {
        json: JSON_FLAG,
        verbose: VERBOSE_FLAG,
    }

    async run(): Promise<void> {
        const { flags } = await this.parse(Whoami)
        
        if (flags.verbose) {
            this.log('[debug] Checking current session')
        }
        
        const session = getCurrentSession()
        
        if (!session) {
            if (flags.json) {
                this.log(JSON.stringify({ active: false }))
            } else {
                this.log('No active session')
            }
            return
        }
        
        if (flags.json) {
            this.log(JSON.stringify({
                active: session.active,
                did: session.did,
                expiry: session.expiry
            }))
        } else {
            this.log(`DID: ${session.did}`)
            this.log(`Active: ${session.active ? 'Yes' : 'No'}`)
            this.log(`Expires: ${session.expiry}`)
        }
    }
}
