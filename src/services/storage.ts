// src/services/storage.ts
// Local storage helpers for identity keys and posts (CDV stub).
// - Keys live under ~/.registryaccord with restrictive permissions.
// - Posts default to ./cdv.json (override via RA_CDV_PATH).
// Functions below perform I/O; validation guards protect against malformed files.
import fs from 'fs-extra'
import path from 'path'
import { CDV_PATH, KEY_DIR, KEY_PATH } from '../config/paths.js'

/**
 * Materialized identity key record persisted locally.
 */
export type StoredKey = {
    did: string
    secretKeyBase64: string
    publicKeyBase64: string
}

/**
 * A locally stored signed post.
 */
export type PostRecord = {
    id: string
    createdAt: string
    text: string
    signatureBase64: string
    publicKeyBase64: string
    did: string
}

function isStoredKey(v: any): v is StoredKey {
    return (
        v &&
        typeof v === 'object' &&
        typeof v.did === 'string' &&
        typeof v.publicKeyBase64 === 'string' &&
        typeof v.secretKeyBase64 === 'string'
    )
}

function isPostRecord(v: any): v is PostRecord {
    return (
        v &&
        typeof v === 'object' &&
        typeof v.id === 'string' &&
        typeof v.createdAt === 'string' &&
        typeof v.text === 'string' &&
        typeof v.signatureBase64 === 'string' &&
        typeof v.publicKeyBase64 === 'string' &&
        typeof v.did === 'string'
    )
}

/** Ensure key directory exists and apply chmod 0700 (best-effort). */
export async function ensureKeyDir(): Promise<void> {
    await fs.ensureDir(KEY_DIR)
    // Enforce restrictive permissions for key directory (best effort, ignore errors on unsupported platforms)
    try {
        await fs.chmod(KEY_DIR, 0o700)
    } catch {}
}

/**
 * Persist the identity key JSON and apply chmod 0600 (best-effort).
 */
export async function saveKey(key: StoredKey): Promise<void> {
    await ensureKeyDir()
    await fs.writeJson(KEY_PATH, key, { spaces: 2 })
    // Enforce restrictive permissions for key file (best effort)
    try {
        await fs.chmod(KEY_PATH, 0o600)
    } catch {}
}

/**
 * Load the identity key JSON. Supports backward-compat mapping from
 * { privateKeyBase64 } to { secretKeyBase64 }. Throws on invalid shapes.
 */
export async function loadKey(): Promise<StoredKey | null> {
    if (!(await fs.pathExists(KEY_PATH))) return null
    const raw = await fs.readJson(KEY_PATH)
    // Backward-compat for older files
    if (raw && raw.privateKeyBase64 && !raw.secretKeyBase64) {
        const mapped = { did: raw.did, secretKeyBase64: raw.privateKeyBase64, publicKeyBase64: raw.publicKeyBase64 }
        if (!isStoredKey(mapped)) throw new Error('Invalid key file format at ' + KEY_PATH)
        return mapped
    }
    if (!isStoredKey(raw)) throw new Error('Invalid key file format at ' + KEY_PATH)
    return raw as StoredKey
}

/**
 * Load posts array from CDV path, validating each entry's shape.
 * Returns [] if file does not exist; throws on malformed data.
 */
export async function loadPosts(): Promise<PostRecord[]> {
    if (!(await fs.pathExists(CDV_PATH))) return []
    const data = await fs.readJson(CDV_PATH)
    if (!Array.isArray(data)) throw new Error('Invalid posts file format at ' + CDV_PATH)
    for (const item of data) {
        if (!isPostRecord(item)) throw new Error('Invalid post entry in ' + CDV_PATH)
    }
    return data as PostRecord[]
}

/** Persist posts array to the CDV path (creates parent directory as needed). */
export async function savePosts(posts: PostRecord[]): Promise<void> {
    await fs.ensureDir(path.dirname(CDV_PATH))
    await fs.writeJson(CDV_PATH, posts, { spaces: 2 })
}

