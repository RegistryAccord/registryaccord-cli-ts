// src/commands/identity/create.ts
// Command: Create a new identity (Ed25519) and persist it locally.
// - Uses native oclif JSON mode for `--json`.
// - Enforces non-zero exit when identity already exists without --force.
import { Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import { generateKeypair } from '../../services/crypto.js'
import { loadKey, saveKey } from '../../services/storage.js'

export default class IdentityCreate extends Command {
    static description = 'Create a new self-sovereign identity and persist to ~/.registryaccord/key.json'

    static enableJsonFlag = true
    static flags = {
        force: Flags.boolean({ char: 'f', summary: 'Overwrite existing identity if present', default: false }),
    }
    static examples = [
        'ra identity:create',
        'ra identity:create --force',
        'ra identity:create --json',
    ]

    async run(): Promise<void> {
        const { flags } = await this.parse(IdentityCreate)

        // Refuse to overwrite unless --force is provided
        const existing = await loadKey()
        if (existing && !flags.force) {
            this.error('An identity already exists; re-run with --force to overwrite', { exit: 2 })
        }

        const kp = await generateKeypair()
        await saveKey({
            did: kp.did,
            secretKeyBase64: kp.secretKeyBase64,
            publicKeyBase64: kp.publicKeyBase64,
        })

        // Return machine-readable output when --json is used
        if (this.jsonEnabled()) {
            this.logJson({ did: kp.did, saved: true })
            return
        }

        this.log(chalk.green('Identity created'))
        this.log(`DID: ${chalk.cyan(kp.did)}`)
        this.log('Key saved to ~/.registryaccord/key.json')
    }
}
