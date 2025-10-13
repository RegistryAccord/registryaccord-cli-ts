// src/commands/config.ts
import { Command } from '@oclif/core'
import { resolveBases } from '../lib/config.js'
import { JSON_FLAG, VERBOSE_FLAG } from '../utils/flags.js'

export default class Config extends Command {
    static description = 'Print effective configuration (redact secrets)'

    static flags = {
        json: JSON_FLAG,
        verbose: VERBOSE_FLAG,
    }

    async run(): Promise<void> {
        const { flags } = await this.parse(Config)
        const bases = resolveBases()
        
        // Redact sensitive information
        const configInfo = {
            identityBase: bases.identityBase,
            cdvBase: bases.cdvBase,
            gatewayBase: bases.gatewayBase,
            env: bases.env,
            output: bases.output
        }
        
        if (flags.json) {
            this.log(JSON.stringify(configInfo))
        } else {
            this.log('Current Configuration:')
            this.log(`  Identity Base URL: ${configInfo.identityBase}`)
            this.log(`  CDV Base URL: ${configInfo.cdvBase}`)
            this.log(`  Gateway Base URL: ${configInfo.gatewayBase}`)
            this.log(`  Environment: ${configInfo.env}`)
            this.log(`  Output Format: ${configInfo.output}`)
        }
    }
}
