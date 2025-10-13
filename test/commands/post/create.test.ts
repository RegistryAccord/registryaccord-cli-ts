import { expect, test } from 'vitest'

test('post:create command structure', async () => {
  // This is a smoke test to verify the command can be imported and has the right structure
  const { default: PostCreate } = await import('../../../src/commands/post/create.js')
  
  expect(PostCreate).toBeDefined()
  expect(PostCreate.description).toContain('Create a post in CDV')
  expect(PostCreate.flags).toBeDefined()
  expect(PostCreate.flags.text).toBeDefined()
  expect(PostCreate.flags.media).toBeDefined()
})
