// src/commands/post/create.ts
import { Args, Command } from '@oclif/core'
import chalk from 'chalk'
import { v4 as uuidv4 } from 'uuid'
import { loadKey, loadPosts, savePosts, PostRecord } from '../../services/storage.js'
import { signMessage } from '../../services/crypto.js'

export default class PostCreate extends Command {
    static description = 'Create and sign a new post with your identity; save to the local CDV stub'

    static args = {
        text: Args.string({ required: true, description: 'Post text' }),
    }

    static enableJsonFlag = true
    static flags = {}
    static examples = [
        'ra post:create "hello world"',
        'ra post:create --json "hello world"',
    ]

    async run(): Promise<void> {
        const { args } = await this.parse(PostCreate)
        const key = await loadKey()
        if (!key) {
            this.error('No identity found. Run `ra identity:create` first.', { exit: 1 })
        }

        const signatureBase64 = await signMessage(args.text, key!.secretKeyBase64)
        const post: PostRecord = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            text: args.text,
            signatureBase64,
            publicKeyBase64: key!.publicKeyBase64,
            did: key!.did,
        }

        const posts = await loadPosts()
        posts.push(post)
        await savePosts(posts)

        if (this.jsonEnabled()) {
            this.logJson({ id: post.id, created: true })
            return
        }

        this.log(chalk.green('Post created and signed'))
    }
}
