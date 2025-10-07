// src/config/paths.ts
import os from 'os'
import path from 'path'

export const KEY_DIR = path.join(os.homedir(), '.registryaccord')
export const KEY_PATH = path.join(KEY_DIR, 'key.json')

// Allow override via RA_CDV_PATH; default to ./cdv.json
export const CDV_PATH = process.env.RA_CDV_PATH
    ? path.resolve(process.env.RA_CDV_PATH)
    : path.resolve(process.cwd(), 'cdv.json')
