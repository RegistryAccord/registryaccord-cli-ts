import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('fs-extra', async () => {
  const actual = await vi.importActual<any>('fs-extra')
  const ensureDir = vi.fn(async () => {})
  const chmod = vi.fn(async () => {})
  const writeJson = vi.fn(async () => {})
  const readJson = vi.fn(async () => ({}))
  const pathExists = vi.fn(async () => false)
  // Return both named and default exports wired to the same spies
  return {
    ...actual,
    ensureDir,
    chmod,
    writeJson,
    readJson,
    pathExists,
    default: {
      ...actual,
      ensureDir,
      chmod,
      writeJson,
      readJson,
      pathExists,
    },
  }
})

import fs from 'fs-extra'
import path from 'path'
import * as paths from '../../src/config/paths.js'
import { ensureKeyDir, saveKey, loadKey, loadPosts, savePosts, type StoredKey, type PostRecord } from '../../src/services/storage.js'

describe('storage service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ensureKeyDir ensures dir and chmod 0700', async () => {
    await ensureKeyDir()
    expect(fs.ensureDir).toHaveBeenCalledWith(paths.KEY_DIR)
    expect(fs.chmod).toHaveBeenCalledWith(paths.KEY_DIR, 0o700)
  })

  it('saveKey writes json and chmod 0600', async () => {
    const key: StoredKey = { did: 'did:ra:ed25519:abc', secretKeyBase64: 's', publicKeyBase64: 'p' }
    await saveKey(key)
    expect(fs.writeJson).toHaveBeenCalledWith(paths.KEY_PATH, key, { spaces: 2 })
    expect(fs.chmod).toHaveBeenCalledWith(paths.KEY_PATH, 0o600)
  })

  it('loadKey returns null when file missing', async () => {
    ;(fs.pathExists as any).mockResolvedValue(false)
    const res = await loadKey()
    expect(res).toBeNull()
  })

  it('loadKey maps legacy privateKeyBase64 and validates shape', async () => {
    ;(fs.pathExists as any).mockResolvedValue(true)
    ;(fs.readJson as any).mockResolvedValue({ did: 'd', privateKeyBase64: 's', publicKeyBase64: 'p' })
    const res = await loadKey()
    expect(res).toEqual({ did: 'd', secretKeyBase64: 's', publicKeyBase64: 'p' })
  })

  it('loadPosts validates array shape and throws on invalid', async () => {
    ;(fs.pathExists as any).mockResolvedValue(true)
    ;(fs.readJson as any).mockResolvedValue([{
      id: '1', createdAt: new Date().toISOString(), text: 't', signatureBase64: 'sig', publicKeyBase64: 'pk', did: 'd'
    }])
    const posts = await loadPosts()
    expect(Array.isArray(posts)).toBe(true)

    ;(fs.readJson as any).mockResolvedValue({ not: 'an array' })
    await expect(loadPosts()).rejects.toThrow('Invalid posts file format')
  })

  it('savePosts writes to CDV_PATH in cwd dir', async () => {
    const posts: PostRecord[] = []
    await savePosts(posts)
    expect(fs.writeJson).toHaveBeenCalledWith(paths.CDV_PATH, posts, { spaces: 2 })
  })
})
