// src/commands/version.ts
import { Command } from '@oclif/core'
import { resolveBases } from '../lib/config.js'
import { JSON_FLAG, VERBOSE_FLAG } from '../utils/flags.js'

const VERSION = '0.1.0' // TODO: Get from package.json
const API_VERSION = 'v1'

export default class Version extends Command {
    static description = 'Print CLI, API targets, and schema versions in use'

    static flags = {
        json: JSON_FLAG,
        verbose: VERBOSE_FLAG,
    }

    async run(): Promise<void> {
        const { flags } = await this.parse(Version)
        const bases = resolveBases()
        
        const versionInfo = {
            cli: VERSION,
            api: API_VERSION,
            identity: bases.identityBase,
            cdv: bases.cdvBase,
            gateway: bases.gatewayBase,
            env: bases.env
        }
        
        if (flags.json) {
            this.log(JSON.stringify(versionInfo))
        } else {
            this.log(`RegistryAccord CLI Version: ${versionInfo.cli}`)
            this.log(`API Version: ${versionInfo.api}`)
            this.log(`Identity Service: ${versionInfo.identity}`)
            this.log(`CDV Service: ${versionInfo.cdv}`)
            this.log(`Gateway Service: ${versionInfo.gateway}`)
            this.log(`Environment: ${versionInfo.env}`)
        }
    }
}
