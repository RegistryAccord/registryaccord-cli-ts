// src/commands/post/list.ts
import { Command } from '@oclif/core'
import chalk from 'chalk'
import { loadPosts } from '../../services/storage.js'
import { verifyMessage } from '../../services/crypto.js'
 

export default class PostList extends Command {
    static description = 'List posts from the local CDV stub and verify their signatures'

    static enableJsonFlag = true
    static flags = {}
    static examples = [
        'ra post:list',
        'ra post:list --json',
    ]

    async run(): Promise<void> {
        const { flags } = await this.parse(PostList)
        const posts = await loadPosts()
        if (this.jsonEnabled()) {
            const annotated = await Promise.all(
                posts.map(async p => ({ ...p, valid: await verifyMessage(p.text, p.signatureBase64, p.publicKeyBase64) })),
            )
            this.logJson({ count: annotated.length, posts: annotated })
            return
        }

        if (posts.length === 0) {
            this.log(chalk.yellow('No posts found'))
            return
        }

        let idx = 1
        for (const p of posts) {
            const ok = await verifyMessage(p.text, p.signatureBase64, p.publicKeyBase64)
            const mark = ok ? chalk.green('✔') : chalk.red('✖')
            this.log(`${mark} [${idx}] ${p.createdAt} — ${p.text}`)
            idx += 1
        }
    }
}
