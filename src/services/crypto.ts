// src/services/crypto.ts (v3 style)
import * as ed from '@noble/ed25519'
import bs58 from 'bs58'

export type Keypair = {
    secretKeyBase64: string
    publicKeyBase64: string
    did: string
}

export async function generateKeypair(): Promise<Keypair> {
    const { secretKey, publicKey } = await ed.keygenAsync()
    const secretKeyBase64 = Buffer.from(secretKey).toString('base64')
    const publicKeyBase64 = Buffer.from(publicKey).toString('base64')
    const did = `did:ra:ed25519:${bs58.encode(publicKey)}`
    return { secretKeyBase64, publicKeyBase64, did }
}

export async function signMessage(message: string, secretKeyBase64: string): Promise<string> {
    const sk = Buffer.from(secretKeyBase64, 'base64')
    const msg = new TextEncoder().encode(message)
    const sig = await ed.signAsync(msg, sk)
    return Buffer.from(sig).toString('base64')
}

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
