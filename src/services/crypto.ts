// src/services/crypto.ts
// Cryptographic primitives used by the CLI.
// Exposes key generation, signing, and verification helpers built on @noble/ed25519.
// These functions are pure and do not perform any I/O.
import * as ed from '@noble/ed25519'
import bs58 from 'bs58'

/**
 * A generated Ed25519 keypair and its derived DID.
 */
export type Keypair = {
    secretKeyBase64: string
    publicKeyBase64: string
    did: string
}

/**
 * Generate a new Ed25519 keypair and a DID of the form
 * `did:ra:ed25519:<base58_public_key>`.
 */
export async function generateKeypair(): Promise<Keypair> {
    const { secretKey, publicKey } = await ed.keygenAsync()
    const secretKeyBase64 = Buffer.from(secretKey).toString('base64')
    const publicKeyBase64 = Buffer.from(publicKey).toString('base64')
    const did = `did:ra:ed25519:${bs58.encode(publicKey)}`
    return { secretKeyBase64, publicKeyBase64, did }
}

/**
 * Sign an arbitrary UTF-8 message with a base64-encoded Ed25519 secret key.
 * Returns a base64 signature string.
 */
export async function signMessage(message: string, secretKeyBase64: string): Promise<string> {
    const sk = Buffer.from(secretKeyBase64, 'base64')
    const msg = new TextEncoder().encode(message)
    const sig = await ed.signAsync(msg, sk)
    return Buffer.from(sig).toString('base64')
}

/**
 * Verify a base64 signature for a given UTF-8 message with a base64-encoded
 * Ed25519 public key.
 */
export async function verifyMessage(
    message: string,
    signatureBase64: string,
    publicKeyBase64: string,
): Promise<boolean> {
    const pk = Buffer.from(publicKeyBase64, 'base64')
    const sig = Buffer.from(signatureBase64, 'base64')
    const msg = new TextEncoder().encode(message)
    return ed.verifyAsync(new Uint8Array(sig), msg, new Uint8Array(pk))
}
