// src/config/paths.ts
// Centralized filesystem paths used by the CLI.
// - Keys are stored under the user's home directory (~/.registryaccord/key.json)
//   to keep identities stable and secure across projects.
// - Posts (CDV stub) default to ./cdv.json in the current working directory.
//   This can be overridden with the RA_CDV_PATH environment variable.
import os from 'os'
import path from 'path'

export const KEY_DIR = path.join(os.homedir(), '.registryaccord')
export const KEY_PATH = path.join(KEY_DIR, 'key.json')

// Allow override via RA_CDV_PATH; default to ./cdv.json
export const CDV_PATH = process.env.RA_CDV_PATH
    ? path.resolve(process.env.RA_CDV_PATH)
    : path.resolve(process.cwd(), 'cdv.json')
